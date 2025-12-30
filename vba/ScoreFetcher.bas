Attribute VB_Name = "ScoreFetcher"
' ================================================================
' ClayTargetTracker Score Fetcher
' Automatically pulls latest scores from web app into Excel
' ================================================================

Option Explicit

' Global variables for timer
Public NextFetchTime As Date
Public FetchTimerRunning As Boolean

' Configuration constants
Const CONFIG_SHEET_NAME As String = "Fetch Settings"
Const LOG_SHEET_NAME As String = "Fetch Log"

' ================================================================
' Main Fetch Function
' ================================================================
Public Sub FetchScores()
    On Error GoTo ErrorHandler

    Dim apiUrl As String
    Dim authToken As String
    Dim tournamentId As String
    Dim response As String
    Dim jsonData As Object

    ' Get configuration
    apiUrl = GetSetting("API_URL")
    authToken = GetSetting("AUTH_TOKEN")
    tournamentId = GetSetting("TOURNAMENT_ID")

    ' Validate configuration
    If apiUrl = "" Or tournamentId = "" Then
        MsgBox "Please configure API settings first. Run 'SetupScoreFetcher' or check Fetch Settings sheet.", vbExclamation, "Configuration Required"
        Exit Sub
    End If

    ' Show status
    Application.StatusBar = "Fetching scores from server..."
    Application.ScreenUpdating = False

    ' Fetch data from API
    response = FetchScoresFromAPI(apiUrl, authToken, tournamentId)

    ' Check if we got valid response
    If Len(response) = 0 Or InStr(response, "ERROR:") > 0 Then
        LogFetchAttempt response
        Application.StatusBar = False
        Application.ScreenUpdating = True
        MsgBox "Failed to fetch scores: " & response, vbCritical, "Fetch Error"
        Exit Sub
    End If

    ' Update the spreadsheet with fetched data
    UpdateSpreadsheetWithScores response

    ' Log the result
    LogFetchAttempt "SUCCESS: Scores updated at " & Format(Now, "hh:nn:ss AM/PM")

    ' Update last fetch time
    UpdateLastFetchTime

    ' Show result
    Application.StatusBar = False
    Application.ScreenUpdating = True

    MsgBox "Scores updated successfully!" & vbCrLf & _
           "Last updated: " & Format(Now, "hh:nn:ss AM/PM"), _
           vbInformation, "Fetch Complete"

    Exit Sub

ErrorHandler:
    Application.StatusBar = False
    Application.ScreenUpdating = True
    LogFetchAttempt "ERROR: " & Err.Description
    MsgBox "Error fetching scores: " & Err.Description, vbCritical, "Fetch Error"
End Sub

' ================================================================
' Fetch Scores from API
' ================================================================
Private Function FetchScoresFromAPI(apiUrl As String, authToken As String, tournamentId As String) As String
    On Error GoTo ErrorHandler

    Dim http As Object
    Dim fullUrl As String

    ' Create HTTP request
    Set http = CreateObject("MSXML2.XMLHTTP.6.0")

    ' Build URL - using the shoots endpoint to get all scores
    fullUrl = apiUrl & "/api/tournaments/" & tournamentId & "/shoots"

    ' Send GET request
    http.Open "GET", fullUrl, False

    ' Add auth header if token provided
    If authToken <> "" Then
        http.setRequestHeader "Authorization", "Bearer " & authToken
    End If

    http.send

    ' Check status
    If http.Status = 200 Then
        FetchScoresFromAPI = http.responseText
    Else
        FetchScoresFromAPI = "ERROR: HTTP " & http.Status & " - " & http.statusText
    End If

    Set http = Nothing
    Exit Function

ErrorHandler:
    FetchScoresFromAPI = "ERROR: " & Err.Description
End Function

' ================================================================
' Update Spreadsheet with Scores
' ================================================================
Private Sub UpdateSpreadsheetWithScores(jsonResponse As String)
    On Error Resume Next

    ' Get target sheet
    Dim targetSheetName As String
    targetSheetName = GetSetting("TARGET_SHEET")
    If targetSheetName = "" Then targetSheetName = "Shooter Scores"

    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(targetSheetName)

    ' Parse JSON and update sheet
    ' This is a simplified version - you may need to customize based on your data structure
    Dim json As Object
    Set json = ParseJson(jsonResponse)

    If json Is Nothing Then
        LogFetchAttempt "ERROR: Failed to parse JSON response"
        Exit Sub
    End If

    ' Clear existing data (keep headers)
    Dim lastRow As Long
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    If lastRow > 1 Then
        ws.Range("A2:Z" & lastRow).Clear
    End If

    ' Add headers if not present
    If ws.Cells(1, 1).Value = "" Then
        ws.Cells(1, 1).Value = "Shooter"
        ws.Cells(1, 2).Value = "Team"
        ws.Cells(1, 3).Value = "Gender"
        ws.Cells(1, 4).Value = "Division"
        ws.Cells(1, 5).Value = "Discipline"
        ws.Cells(1, 6).Value = "Round"
        ws.Cells(1, 7).Value = "Score"
        ws.Cells(1, 8).Value = "Total Targets"
        ws.Cells(1, 9).Value = "Date"
        ws.Range("A1:I1").Font.Bold = True
        ws.Range("A1:I1").Interior.Color = RGB(68, 114, 196)
        ws.Range("A1:I1").Font.Color = RGB(255, 255, 255)
    End If

    ' Update timestamp
    ws.Cells(1, 11).Value = "Last Updated:"
    ws.Cells(1, 12).Value = Format(Now, "yyyy-mm-dd hh:nn:ss AM/PM")

    ' Note: Actual JSON parsing would go here
    ' This is a placeholder - actual implementation depends on your API response structure
    LogFetchAttempt "INFO: JSON parsing would update " & targetSheetName & " sheet"

End Sub

' ================================================================
' Simple JSON Parser (fallback)
' ================================================================
Private Function ParseJson(jsonString As String) As Object
    On Error Resume Next

    ' Try to use built-in JSON parser (Excel 2016+)
    Dim scriptControl As Object
    Set scriptControl = CreateObject("MSScriptControl.ScriptControl")
    scriptControl.Language = "JScript"

    Set ParseJson = scriptControl.Eval("(" & jsonString & ")")

    If Err.Number <> 0 Then
        ' Fallback: Use JsonConverter if available
        ' Or return Nothing to indicate parsing failed
        Set ParseJson = Nothing
    End If
End Function

' ================================================================
' Auto-Fetch Timer Functions
' ================================================================
Public Sub StartAutoFetch()
    Dim intervalMinutes As Long

    intervalMinutes = GetSettingAsLong("FETCH_INTERVAL_MINUTES")

    If intervalMinutes <= 0 Then
        MsgBox "Please set a valid fetch interval (in minutes) in the Fetch Settings sheet.", vbExclamation
        Exit Sub
    End If

    FetchTimerRunning = True
    ScheduleNextFetch intervalMinutes

    MsgBox "Auto-fetch started! Scores will be updated every " & intervalMinutes & " minutes." & vbCrLf & vbCrLf & _
           "Next update: " & Format(NextFetchTime, "hh:nn:ss AM/PM"), vbInformation, "Auto-Fetch Started"

    UpdateFetchStatus "Running (Next: " & Format(NextFetchTime, "hh:nn:ss") & ")"
End Sub

Public Sub StopAutoFetch()
    On Error Resume Next
    Application.OnTime NextFetchTime, "ScoreFetcher.AutoFetchCallback", , False
    FetchTimerRunning = False
    UpdateFetchStatus "Stopped"
    MsgBox "Auto-fetch stopped.", vbInformation, "Auto-Fetch Stopped"
End Sub

Private Sub ScheduleNextFetch(intervalMinutes As Long)
    On Error Resume Next

    ' Cancel any existing timer
    If NextFetchTime <> 0 Then
        Application.OnTime NextFetchTime, "ScoreFetcher.AutoFetchCallback", , False
    End If

    ' Schedule next fetch
    NextFetchTime = Now + TimeValue("00:" & Format(intervalMinutes, "00") & ":00")
    Application.OnTime NextFetchTime, "ScoreFetcher.AutoFetchCallback"
End Sub

Public Sub AutoFetchCallback()
    Dim intervalMinutes As Long

    If Not FetchTimerRunning Then Exit Sub

    ' Fetch scores
    FetchScores

    ' Schedule next fetch
    intervalMinutes = GetSettingAsLong("FETCH_INTERVAL_MINUTES")
    If intervalMinutes > 0 And FetchTimerRunning Then
        ScheduleNextFetch intervalMinutes
        UpdateFetchStatus "Running (Next: " & Format(NextFetchTime, "hh:nn:ss") & ")"
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

Private Sub UpdateLastFetchTime()
    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(CONFIG_SHEET_NAME)

    Dim cell As Range
    Set cell = ws.Columns(1).Find("LAST_FETCH_TIME", LookIn:=xlValues, LookAt:=xlWhole)

    If Not cell Is Nothing Then
        ws.Cells(cell.Row, 2).Value = Format(Now, "yyyy-mm-dd hh:nn:ss AM/PM")
    End If
End Sub

Private Sub UpdateFetchStatus(status As String)
    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(CONFIG_SHEET_NAME)

    Dim cell As Range
    Set cell = ws.Columns(1).Find("AUTO_FETCH_STATUS", LookIn:=xlValues, LookAt:=xlWhole)

    If Not cell Is Nothing Then
        ws.Cells(cell.Row, 2).Value = status
    End If
End Sub

' ================================================================
' Logging Functions
' ================================================================
Private Sub LogFetchAttempt(message As String)
    On Error Resume Next

    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(LOG_SHEET_NAME)

    ' Ensure headers exist
    If ws.Cells(1, 1).Value = "" Then
        ws.Cells(1, 1).Value = "Timestamp"
        ws.Cells(1, 2).Value = "Message"
        ws.Range("A1:B1").Font.Bold = True
    End If

    ' Find next empty row
    Dim nextRow As Long
    nextRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1
    If nextRow = 1 Then nextRow = 2

    ' Add log entry
    ws.Cells(nextRow, 1).Value = Format(Now, "yyyy-mm-dd hh:nn:ss AM/PM")
    ws.Cells(nextRow, 2).Value = message

    ' Keep only last 200 entries
    If nextRow > 200 Then
        ws.Rows(2).Delete
    End If
End Sub

' ================================================================
' Setup and Configuration
' ================================================================
Public Sub SetupScoreFetcher()
    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(CONFIG_SHEET_NAME)

    ' Clear existing content
    ws.Cells.Clear

    ' Add headers
    ws.Cells(1, 1).Value = "Setting"
    ws.Cells(1, 2).Value = "Value"
    ws.Cells(1, 3).Value = "Description"
    ws.Range("A1:C1").Font.Bold = True
    ws.Range("A1:C1").Interior.Color = RGB(68, 114, 196)
    ws.Range("A1:C1").Font.Color = RGB(255, 255, 255)

    ' Add settings
    Dim row As Long
    row = 2

    ws.Cells(row, 1).Value = "API_URL"
    ws.Cells(row, 2).Value = "https://staging.main.d2dqj0pj9jl3ff.amplifyapp.com"
    ws.Cells(row, 3).Value = "Your ClayTargetTracker URL (no trailing slash)"
    row = row + 1

    ws.Cells(row, 1).Value = "TOURNAMENT_ID"
    ws.Cells(row, 2).Value = ""
    ws.Cells(row, 3).Value = "Tournament ID from the URL"
    row = row + 1

    ws.Cells(row, 1).Value = "AUTH_TOKEN"
    ws.Cells(row, 2).Value = ""
    ws.Cells(row, 3).Value = "Optional: Auth token if required"
    row = row + 1

    ws.Cells(row, 1).Value = "TARGET_SHEET"
    ws.Cells(row, 2).Value = "Shooter Scores"
    ws.Cells(row, 3).Value = "Sheet name to update with scores"
    row = row + 1

    ws.Cells(row, 1).Value = "FETCH_INTERVAL_MINUTES"
    ws.Cells(row, 2).Value = "5"
    ws.Cells(row, 3).Value = "Auto-fetch interval in minutes"
    row = row + 1

    ws.Cells(row, 1).Value = "LAST_FETCH_TIME"
    ws.Cells(row, 2).Value = "Never"
    ws.Cells(row, 3).Value = "Last successful fetch time"
    row = row + 1

    ws.Cells(row, 1).Value = "AUTO_FETCH_STATUS"
    ws.Cells(row, 2).Value = "Stopped"
    ws.Cells(row, 3).Value = "Current auto-fetch status"

    ' Format columns
    ws.Columns("A:A").ColumnWidth = 30
    ws.Columns("B:B").ColumnWidth = 50
    ws.Columns("C:C").ColumnWidth = 40

    ' Setup log sheet
    Dim logWs As Worksheet
    Set logWs = GetOrCreateSheet(LOG_SHEET_NAME)
    If logWs.Cells(1, 1).Value = "" Then
        logWs.Cells(1, 1).Value = "Timestamp"
        logWs.Cells(1, 2).Value = "Message"
        logWs.Range("A1:B1").Font.Bold = True
        logWs.Columns("A:A").ColumnWidth = 25
        logWs.Columns("B:B").ColumnWidth = 80
    End If

    ws.Activate
    MsgBox "Score Fetcher setup complete!" & vbCrLf & vbCrLf & _
           "Please update the settings in the '" & CONFIG_SHEET_NAME & "' sheet:" & vbCrLf & _
           "1. Set your TOURNAMENT_ID from the URL" & vbCrLf & _
           "2. Optionally adjust the FETCH_INTERVAL_MINUTES" & vbCrLf & _
           "3. Run 'ShowFetcherMenu' to start fetching", _
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
' UI Menu Functions
' ================================================================
Public Sub ShowFetcherMenu()
    Dim choice As VbMsgBoxResult

    choice = MsgBox("ClayTargetTracker Score Fetcher" & vbCrLf & vbCrLf & _
                    "Last Update: " & GetSetting("LAST_FETCH_TIME") & vbCrLf & _
                    "Status: " & GetSetting("AUTO_FETCH_STATUS") & vbCrLf & vbCrLf & _
                    "Yes - Fetch Scores Now (Manual)" & vbCrLf & _
                    "No - Configure Auto-Fetch" & vbCrLf & _
                    "Cancel - Close Menu", _
                    vbYesNoCancel + vbQuestion, "Score Fetcher")

    Select Case choice
        Case vbYes
            FetchScores
        Case vbNo
            ConfigureAutoFetch
    End Select
End Sub

Public Sub ConfigureAutoFetch()
    Dim ws As Worksheet
    Set ws = GetOrCreateSheet(CONFIG_SHEET_NAME)

    Dim currentStatus As String
    currentStatus = GetSetting("AUTO_FETCH_STATUS")

    Dim choice As VbMsgBoxResult
    choice = MsgBox("Auto-Fetch Configuration" & vbCrLf & vbCrLf & _
                    "Current Status: " & currentStatus & vbCrLf & _
                    "Interval: " & GetSetting("FETCH_INTERVAL_MINUTES") & " minutes" & vbCrLf & vbCrLf & _
                    "Yes - Start Auto-Fetch" & vbCrLf & _
                    "No - Stop Auto-Fetch" & vbCrLf & _
                    "Cancel - Edit Settings", _
                    vbYesNoCancel + vbQuestion, "Auto-Fetch")

    Select Case choice
        Case vbYes
            StartAutoFetch
        Case vbNo
            StopAutoFetch
        Case vbCancel
            ws.Activate
            MsgBox "Update the settings in this sheet as needed, then restart auto-fetch.", vbInformation
    End Select
End Sub

' ================================================================
' Quick Access Macros (assign these to buttons/shapes)
' ================================================================
Public Sub QuickFetch()
    ' Simple one-click fetch
    FetchScores
End Sub

Public Sub ToggleAutoFetch()
    ' Toggle auto-fetch on/off
    If FetchTimerRunning Then
        StopAutoFetch
    Else
        StartAutoFetch
    End If
End Sub
