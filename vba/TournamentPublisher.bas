Attribute VB_Name = "TournamentPublisher"
' ================================================================
' Tournament Score Publisher for ClayTargetTracker
' Automatically publishes scores from Excel to the web application
' ================================================================

Option Explicit

' Global variables for timer
Public NextPublishTime As Date
Public PublishTimerRunning As Boolean

' Configuration constants
Const CONFIG_SHEET_NAME As String = "Publisher Settings"
Const LOG_SHEET_NAME As String = "Publish Log"

' ================================================================
' Main Publishing Function
' ================================================================
Public Sub PublishScores()
    On Error GoTo ErrorHandler

    Dim apiUrl As String
    Dim authToken As String
    Dim tournamentId As String
    Dim filePath As String
    Dim response As String

    ' Get configuration
    apiUrl = GetSetting("API_URL")
    authToken = GetSetting("AUTH_TOKEN")
    tournamentId = GetSetting("TOURNAMENT_ID")

    ' Validate configuration
    If apiUrl = "" Or authToken = "" Or tournamentId = "" Then
        MsgBox "Please configure API settings first. Click 'Configure Publisher' button.", vbExclamation, "Configuration Required"
        Exit Sub
    End If

    ' Remove trailing slash from API URL if present
    If Right(apiUrl, 1) = "/" Then
        apiUrl = Left(apiUrl, Len(apiUrl) - 1)
    End If

    ' Show status
    Application.StatusBar = "Publishing scores to server..."
    Application.ScreenUpdating = False

    ' Save the workbook first
    ThisWorkbook.Save

    ' Upload as JSON (no file path needed - reads directly from sheets)
    response = UploadExcelFile(apiUrl, authToken, tournamentId, "")

    ' Log the result
    LogPublishAttempt response

    ' Show result
    Application.StatusBar = False
    Application.ScreenUpdating = True

    If InStr(response, "success") > 0 Or InStr(response, "imported") > 0 Then
        UpdateLastPublishTime
        MsgBox "Scores published successfully!", vbInformation, "Publish Complete"
    Else
        MsgBox "Publish completed. Check the Publish Log for details.", vbInformation, "Publish Status"
    End If

    Exit Sub

ErrorHandler:
    Application.StatusBar = False
    Application.ScreenUpdating = True
    LogPublishAttempt "ERROR: " & Err.Description
    MsgBox "Error publishing scores: " & Err.Description, vbCritical, "Publish Error"
End Sub

' ================================================================
' Upload Excel Data as JSON (much simpler than file upload)
' ================================================================
Private Function UploadExcelFile(apiUrl As String, authToken As String, tournamentId As String, filePath As String) As String
    On Error GoTo ErrorHandler

    Dim http As Object
    Dim jsonData As String
    Dim fullUrl As String

    ' Build JSON from Excel sheets
    jsonData = BuildJSONFromSheets()

    ' Create HTTP request
    Set http = CreateObject("MSXML2.XMLHTTP")

    ' Build full URL for JSON endpoint
    fullUrl = apiUrl & "/api/tournaments/" & tournamentId & "/import-scores-json"

    ' Debug: Log the URL being called
    Debug.Print "Posting to URL: " & fullUrl

    ' Send request
    http.Open "POST", fullUrl, False
    http.setRequestHeader "Authorization", "Bearer " & authToken
    http.setRequestHeader "Content-Type", "application/json"
    http.send jsonData

    ' Get response
    If http.Status = 404 Then
        UploadExcelFile = "Status: 404 Not Found - URL: " & fullUrl & vbCrLf & "Response: " & http.responseText
    Else
        UploadExcelFile = "Status: " & http.Status & " - " & http.responseText
    End If

    Set http = Nothing
    Exit Function

ErrorHandler:
    UploadExcelFile = "ERROR: " & Err.Description & " (Error " & Err.Number & ")"
End Function

' ================================================================
' Build JSON from Excel Sheets
' ================================================================
Private Function BuildJSONFromSheets() As String
    On Error GoTo ErrorHandler

    Dim json As String
    Dim sheets As String

    ' Start JSON object
    json = "{"
    json = json & """sheets"":{"

    ' Add Tournament Setup sheet if it exists
    If SheetExists("Tournament Setup") Then
        sheets = sheets & """Tournament Setup"":" & SheetToJSON("Tournament Setup") & ","
    End If

    ' Add Shooter History sheet if it exists
    If SheetExists("Shooter History") Then
        sheets = sheets & """Shooter History"":" & SheetToJSON("Shooter History") & ","
    End If

    ' Add Shooter Scores sheet if it exists
    If SheetExists("Shooter Scores") Then
        sheets = sheets & """Shooter Scores"":" & SheetToJSON("Shooter Scores") & ","
    End If

    ' Remove trailing comma if exists
    If Right(sheets, 1) = "," Then
        sheets = Left(sheets, Len(sheets) - 1)
    End If

    json = json & sheets
    json = json & "}}"

    BuildJSONFromSheets = json
    Exit Function

ErrorHandler:
    BuildJSONFromSheets = "{""error"":""" & Err.Description & """}"
End Function

' ================================================================
' Convert Sheet to JSON Array
' ================================================================
Private Function SheetToJSON(sheetName As String) As String
    On Error GoTo ErrorHandler

    Dim ws As Worksheet
    Dim lastRow As Long
    Dim lastCol As Long
    Dim row As Long, col As Long
    Dim json As String
    Dim cellValue As Variant
    Dim rowJson As String

    Set ws = ThisWorkbook.Worksheets(sheetName)

    ' Find last row and column with data
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).row
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column

    ' Start array
    json = "["

    ' Loop through rows
    For row = 1 To lastRow
        rowJson = "["

        ' Loop through columns
        For col = 1 To lastCol
            cellValue = ws.Cells(row, col).Value

            ' Convert cell value to JSON
            If IsEmpty(cellValue) Then
                rowJson = rowJson & "null,"
            ElseIf IsNumeric(cellValue) Then
                rowJson = rowJson & cellValue & ","
            Else
                ' Escape quotes and special characters in strings
                Dim strValue As String
                strValue = CStr(cellValue)
                strValue = Replace(strValue, "\", "\\")
                strValue = Replace(strValue, """", "\""")
                strValue = Replace(strValue, vbCr, "")
                strValue = Replace(strValue, vbLf, "")
                strValue = Replace(strValue, vbTab, " ")
                rowJson = rowJson & """" & strValue & ""","
            End If
        Next col

        ' Remove trailing comma and close row array
        If Right(rowJson, 1) = "," Then
            rowJson = Left(rowJson, Len(rowJson) - 1)
        End If
        rowJson = rowJson & "],"

        json = json & rowJson
    Next row

    ' Remove trailing comma and close array
    If Right(json, 1) = "," Then
        json = Left(json, Len(json) - 1)
    End If
    json = json & "]"

    SheetToJSON = json
    Exit Function

ErrorHandler:
    SheetToJSON = "[]"
End Function

' ================================================================
' Check if Sheet Exists
' ================================================================
Private Function SheetExists(sheetName As String) As Boolean
    On Error Resume Next
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(sheetName)
    SheetExists = Not ws Is Nothing
    On Error GoTo 0
End Function

' ================================================================
' Build Multipart Form Data
' ================================================================
Private Function BuildMultipartData(fileData() As Byte, boundary As String, fieldName As String, fileName As String) As Byte()
    Dim header As String
    Dim footer As String
    Dim headerBytes() As Byte
    Dim footerBytes() As Byte
    Dim result() As Byte
    Dim i As Long, j As Long

    ' Build header
    header = "--" & boundary & vbCrLf & _
             "Content-Disposition: form-data; name=""" & fieldName & """; filename=""" & fileName & """" & vbCrLf & _
             "Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" & vbCrLf & vbCrLf

    ' Build footer
    footer = vbCrLf & "--" & boundary & "--" & vbCrLf

    ' Convert to bytes
    headerBytes = StrConv(header, vbFromUnicode)
    footerBytes = StrConv(footer, vbFromUnicode)

    ' Combine all parts
    ReDim result(UBound(headerBytes) + UBound(fileData) + UBound(footerBytes) + 2)

    j = 0
    For i = 0 To UBound(headerBytes)
        result(j) = headerBytes(i)
        j = j + 1
    Next i

    For i = 0 To UBound(fileData)
        result(j) = fileData(i)
        j = j + 1
    Next i

    For i = 0 To UBound(footerBytes)
        result(j) = footerBytes(i)
        j = j + 1
    Next i

    BuildMultipartData = result
End Function

' ================================================================
' Auto-Publish Timer Functions
' ================================================================
Public Sub StartAutoPublish()
    Dim intervalMinutes As Long

    intervalMinutes = GetSettingAsLong("PUBLISH_INTERVAL_MINUTES")

    If intervalMinutes <= 0 Then
        MsgBox "Please set a valid publish interval (in minutes) in the Publisher Settings sheet.", vbExclamation
        Exit Sub
    End If

    PublishTimerRunning = True
    ScheduleNextPublish intervalMinutes

    MsgBox "Auto-publish started! Scores will be published every " & intervalMinutes & " minutes." & vbCrLf & vbCrLf & _
           "Next publish: " & Format(NextPublishTime, "hh:nn:ss AM/PM"), vbInformation, "Auto-Publish Started"

    UpdatePublishStatus "Running (Next: " & Format(NextPublishTime, "hh:nn:ss") & ")"
End Sub

Public Sub StopAutoPublish()
    On Error Resume Next
    Application.OnTime NextPublishTime, "TournamentPublisher.AutoPublishCallback", , False
    PublishTimerRunning = False
    UpdatePublishStatus "Stopped"
    MsgBox "Auto-publish stopped.", vbInformation, "Auto-Publish Stopped"
End Sub

Private Sub ScheduleNextPublish(intervalMinutes As Long)
    On Error Resume Next

    ' Cancel any existing timer
    If NextPublishTime <> 0 Then
        Application.OnTime NextPublishTime, "TournamentPublisher.AutoPublishCallback", , False
    End If

    ' Schedule next publish
    NextPublishTime = Now + TimeValue("00:" & Format(intervalMinutes, "00") & ":00")
    Application.OnTime NextPublishTime, "TournamentPublisher.AutoPublishCallback"
End Sub

Public Sub AutoPublishCallback()
    Dim intervalMinutes As Long

    If Not PublishTimerRunning Then Exit Sub

    ' Publish scores
    PublishScores

    ' Schedule next publish
    intervalMinutes = GetSettingAsLong("PUBLISH_INTERVAL_MINUTES")
    If intervalMinutes > 0 And PublishTimerRunning Then
        ScheduleNextPublish intervalMinutes
        UpdatePublishStatus "Running (Next: " & Format(NextPublishTime, "hh:nn:ss") & ")"
    End If
End Sub

' ================================================================
' Configuration Functions
' ================================================================
Private Function GetSetting(settingName As String) As String
    On Error Resume Next
    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(CONFIG_SHEET_NAME)

    Dim cell As Range
    Set cell = ws.Columns(1).Find(settingName, LookIn:=xlValues, LookAt:=xlWhole)

    If Not cell Is Nothing Then
        GetSetting = ws.Cells(cell.Row, 2).Value
    Else
        GetSetting = ""
    End If
End Function

Private Function GetSettingAsLong(settingName As String) As Long
    On Error Resume Next
    GetSettingAsLong = CLng(GetSetting(settingName))
    If Err.Number <> 0 Then GetSettingAsLong = 0
End Function

Private Sub UpdateLastPublishTime()
    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(CONFIG_SHEET_NAME)

    Dim cell As Range
    Set cell = ws.Columns(1).Find("LAST_PUBLISH_TIME", LookIn:=xlValues, LookAt:=xlWhole)

    If Not cell Is Nothing Then
        ws.Cells(cell.Row, 2).Value = Format(Now, "yyyy-mm-dd hh:nn:ss AM/PM")
    End If
End Sub

Private Sub UpdatePublishStatus(status As String)
    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(CONFIG_SHEET_NAME)

    Dim cell As Range
    Set cell = ws.Columns(1).Find("AUTO_PUBLISH_STATUS", LookIn:=xlValues, LookAt:=xlWhole)

    If Not cell Is Nothing Then
        ws.Cells(cell.Row, 2).Value = status
    End If
End Sub

' ================================================================
' Logging Functions
' ================================================================
Private Sub LogPublishAttempt(response As String)
    On Error Resume Next

    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(LOG_SHEET_NAME)

    ' Find next empty row
    Dim nextRow As Long
    nextRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1
    If nextRow = 2 And ws.Cells(1, 1).Value = "" Then nextRow = 1

    ' Add log entry
    ws.Cells(nextRow, 1).Value = Format(Now, "yyyy-mm-dd hh:nn:ss AM/PM")
    ws.Cells(nextRow, 2).Value = response

    ' Keep only last 100 entries
    If nextRow > 100 Then
        ws.Rows(1).Delete
    End If
End Sub

' ================================================================
' Setup and Configuration
' ================================================================
Public Sub SetupPublisher()
    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(CONFIG_SHEET_NAME)

    ' Clear existing content
    ws.Cells.Clear

    ' Add headers
    ws.Cells(1, 1).Value = "Setting"
    ws.Cells(1, 2).Value = "Value"
    ws.Range("A1:B1").Font.Bold = True
    ws.Range("A1:B1").Interior.Color = RGB(68, 114, 196)
    ws.Range("A1:B1").Font.Color = RGB(255, 255, 255)

    ' Add settings
    Dim row As Long
    row = 2

    ws.Cells(row, 1).Value = "API_URL"
    ws.Cells(row, 2).Value = "https://your-app-url.com"
    row = row + 1

    ws.Cells(row, 1).Value = "AUTH_TOKEN"
    ws.Cells(row, 2).Value = "your-auth-token-here"
    row = row + 1

    ws.Cells(row, 1).Value = "TOURNAMENT_ID"
    ws.Cells(row, 2).Value = "your-tournament-id"
    row = row + 1

    ws.Cells(row, 1).Value = "PUBLISH_INTERVAL_MINUTES"
    ws.Cells(row, 2).Value = "5"
    row = row + 1

    ws.Cells(row, 1).Value = "LAST_PUBLISH_TIME"
    ws.Cells(row, 2).Value = "Never"
    row = row + 1

    ws.Cells(row, 1).Value = "AUTO_PUBLISH_STATUS"
    ws.Cells(row, 2).Value = "Stopped"

    ' Format
    ws.Columns("A:A").ColumnWidth = 30
    ws.Columns("B:B").ColumnWidth = 50

    ' Setup log sheet
    Dim logWs As Worksheet
    Set logWs = GetOrCreateSheet(LOG_SHEET_NAME)
    logWs.Cells.Clear
    logWs.Cells(1, 1).Value = "Timestamp"
    logWs.Cells(1, 2).Value = "Response"
    logWs.Range("A1:B1").Font.Bold = True
    logWs.Columns("A:A").ColumnWidth = 25
    logWs.Columns("B:B").ColumnWidth = 80

    ws.Activate
    MsgBox "Publisher setup complete!" & vbCrLf & vbCrLf & _
           "Please update the settings in the '" & CONFIG_SHEET_NAME & "' sheet with your API details.", _
           vbInformation, "Setup Complete"
End Sub

Private Function GetOrCreateSheet(sheetName As String) As Worksheet
    On Error Resume Next
    Set GetOrCreateSheet = ThisWorkbook.Worksheets(sheetName)

    If GetOrCreateSheet Is Nothing Then
        Set GetOrCreateSheet = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
        GetOrCreateSheet.Name = sheetName
    End If

    On Error GoTo 0
End Function

' ================================================================
' UI Ribbon/Button Functions
' ================================================================
Public Sub ShowPublisherMenu()
    Dim choice As VbMsgBoxResult

    choice = MsgBox("Tournament Score Publisher" & vbCrLf & vbCrLf & _
                    "Choose an option:" & vbCrLf & vbCrLf & _
                    "Yes - Publish Scores Now (Manual)" & vbCrLf & _
                    "No - Configure Auto-Publish Settings" & vbCrLf & _
                    "Cancel - Close Menu", _
                    vbYesNoCancel + vbQuestion, "Score Publisher")

    Select Case choice
        Case vbYes
            PublishScores
        Case vbNo
            ConfigureAutoPublish
    End Select
End Sub

Public Sub ConfigureAutoPublish()
    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(CONFIG_SHEET_NAME)

    Dim choice As VbMsgBoxResult
    choice = MsgBox("Auto-Publish Configuration" & vbCrLf & vbCrLf & _
                    "Current Status: " & GetSetting("AUTO_PUBLISH_STATUS") & vbCrLf & vbCrLf & _
                    "Yes - Start Auto-Publish" & vbCrLf & _
                    "No - Stop Auto-Publish" & vbCrLf & _
                    "Cancel - Edit Settings", _
                    vbYesNoCancel + vbQuestion, "Auto-Publish")

    Select Case choice
        Case vbYes
            StartAutoPublish
        Case vbNo
            StopAutoPublish
        Case vbCancel
            ws.Activate
            MsgBox "Update the settings in this sheet as needed.", vbInformation
    End Select
End Sub
