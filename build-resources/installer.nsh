; Custom NSIS installer script for Library Management System
; This script adds custom installation steps and configuration

!include MUI2.nsh
!include FileFunc.nsh

; Custom pages and functions
!macro customInstall
  ; Create application data directory
  CreateDirectory "$APPDATA\Library Management System"
  
  ; Copy default database if it doesn't exist
  ${If} ${FileExists} "$APPDATA\Library Management System\library.db"
    DetailPrint "Database already exists, keeping existing data"
  ${Else}
    DetailPrint "Creating default database"
    CopyFiles "$INSTDIR\resources\library.db" "$APPDATA\Library Management System\library.db"
  ${EndIf}
  
  ; Create desktop shortcut with custom icon
  CreateShortCut "$DESKTOP\Library Management System.lnk" "$INSTDIR\Library Management System.exe" "" "$INSTDIR\Library Management System.exe" 0
  
  ; Create start menu shortcuts
  CreateDirectory "$SMPROGRAMS\Library Management System"
  CreateShortCut "$SMPROGRAMS\Library Management System\Library Management System.lnk" "$INSTDIR\Library Management System.exe"
  CreateShortCut "$SMPROGRAMS\Library Management System\Uninstall.lnk" "$INSTDIR\Uninstall Library Management System.exe"
  
  ; Register file associations (optional)
  WriteRegStr HKCR ".lms" "" "LibraryManagementFile"
  WriteRegStr HKCR "LibraryManagementFile" "" "Library Management System File"
  WriteRegStr HKCR "LibraryManagementFile\DefaultIcon" "" "$INSTDIR\Library Management System.exe,0"
  
  ; Write registry information for Add/Remove Programs
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "DisplayName" "Library Management System"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "Publisher" "Yashraj Salunkhe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "DisplayIcon" "$INSTDIR\Library Management System.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "HelpLink" "https://github.com/Yashrajsalunkhe/library-management"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_REGISTRY_KEY}" "NoRepair" 1
!macroend

!macro customUnInstall
  ; Remove application data (with user confirmation)
  MessageBox MB_YESNO "Do you want to remove all application data including the database? This cannot be undone." /SD IDNO IDNO skipDataRemoval
    RMDir /r "$APPDATA\Library Management System"
  skipDataRemoval:
  
  ; Remove registry entries
  DeleteRegKey HKCR ".lms"
  DeleteRegKey HKCR "LibraryManagementFile"
  
  ; Remove shortcuts
  Delete "$DESKTOP\Library Management System.lnk"
  RMDir /r "$SMPROGRAMS\Library Management System"
!macroend

; Custom welcome message
!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
  !define MUI_WELCOMEPAGE_TITLE "Welcome to Library Management System Setup"
  !define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of Library Management System.$\r$\n$\r$\nThis software helps you manage library operations including member management, book tracking, attendance, and reporting.$\r$\n$\r$\nClick Next to continue."
!macroend