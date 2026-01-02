# Tournament Score Publisher - VBA Scripts

This folder contains VBA scripts for publishing scores from Excel to ClayTargetTracker web application.

## 📁 Files

| File | Platform | Description |
|------|----------|-------------|
| **TournamentPublisher-Mac.bas** | macOS | Mac-compatible version using `curl` |
| **TournamentPublisher.bas** | Windows | Windows version using `MSXML2.XMLHTTP` |
| **ScoreFetcher.bas** | Both | Fetch scores FROM web app TO Excel (experimental) |
| **INSTALLATION_GUIDE.md** | Both | Complete installation instructions |

## 🖥️ Which Version Should I Use?

### For macOS (Mac Excel)
Use **`TournamentPublisher-Mac.bas`**
- Uses `curl` command via `MacScript` for HTTP requests
- No ActiveX dependencies (ActiveX doesn't work on Mac)
- Requires `curl` (pre-installed on macOS)

### For Windows (Windows Excel)
Use **`TournamentPublisher.bas`**
- Uses `MSXML2.XMLHTTP` ActiveX component
- Standard Windows VBA HTTP library
- Works with Windows Excel 2010+

## 🚀 Quick Start

### Installation (Same for Both Versions)

1. **Open your TournamentTracker.xlsx file**
2. Press **Alt + F11** (Windows) or **Fn + Option + F11** (Mac) to open VBA Editor
3. **Import the correct version:**
   - **Mac**: Import `TournamentPublisher-Mac.bas`
   - **Windows**: Import `TournamentPublisher.bas`
4. **Run Setup:**
   - Press **F5** → Type `SetupPublisher` → Click Run
5. **Configure Settings:**
   - Go to "Publisher Settings" sheet
   - Add your API URL, AUTH_TOKEN, and TOURNAMENT_ID
6. **Add Button:**
   - Developer tab → Insert → Button
   - Assign macro: `ShowPublisherMenu`

## 🔑 Getting Your API Key

1. Log into your ClayTargetTracker as admin
2. Go to Admin Dashboard (`/admin`)
3. Click **"🔑 API Keys"** button
4. Click **"Create API Key"**
5. Enter a name and copy the generated key
6. Paste into `AUTH_TOKEN` field in Publisher Settings sheet

## 🔧 Troubleshooting

### Mac: "ActiveX component can't create object" Error
✅ **Solution**: You're using the wrong version. Use `TournamentPublisher-Mac.bas` instead.

### Mac: "do shell script" permission denied
✅ **Solution**: Go to System Preferences → Security & Privacy → Privacy → Automation → Grant Excel permission

### Mac: curl not found
✅ **Test**: Run `TestCurl` macro to check if curl is available
✅ **Solution**: curl is pre-installed on macOS. If missing, install via Homebrew: `brew install curl`

### Windows: "ActiveX component can't create object"
✅ **Solution**:
1. Check if you're using `TournamentPublisher.bas` (not the Mac version)
2. Enable "Microsoft XML, v6.0" in Tools → References
3. Run Excel as Administrator

### HTTP 401 Unauthorized Error
✅ **Check**: API key is correct and hasn't expired
✅ **Solution**: Generate a new API key from admin panel

### HTTP 403 Forbidden Error
✅ **Check**: Your user account has admin role
✅ **Solution**: Ask an admin to grant you admin access

## 📊 Features

Both versions support:
- ✅ Manual publish button
- ✅ Auto-publish every X minutes
- ✅ Configurable settings
- ✅ Publish logging
- ✅ Error handling
- ✅ Status tracking

## 🔐 Security Notes

- Store your Excel file securely - it contains your API key
- Don't share your API key publicly
- Consider password-protecting the Publisher Settings sheet
- Deactivate API keys when no longer needed

## 📚 Documentation

See **INSTALLATION_GUIDE.md** for complete step-by-step instructions.

## 💡 Tips

### Auto-Publish During Tournament
Set `PUBLISH_INTERVAL_MINUTES` to `1` or `2` for near-real-time updates.

### One-Time Manual Publish
Just click the button when you want to publish - no need to enable auto-publish.

### Test First
Always test with a manual publish before enabling auto-publish.

### Keep Excel Open
Auto-publish only works while Excel is open. Don't close Excel or put your computer to sleep.

## ⚠️ Known Limitations

### Mac Version
- Requires macOS 10.10 or later
- Excel must have permission to run shell scripts
- May show security prompts on first run

### Windows Version
- Requires Windows Excel 2010 or later
- Requires MSXML2.XMLHTTP (usually pre-installed)
- May be blocked by antivirus software

## 🐛 Reporting Issues

If you encounter issues:
1. Check the "Publish Log" sheet for error details
2. Verify all settings in "Publisher Settings" sheet
3. Test with manual publish before auto-publish
4. Contact your administrator with error logs

---

**Platform Detection:**
- macOS: `Platform: darwin`
- Windows: `Platform: win32`

**Author**: ClayTargetTracker Development Team
**Version**: 1.0
**Last Updated**: December 2024
