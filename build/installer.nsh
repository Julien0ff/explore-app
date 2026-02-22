!macro customHeader
  !ifdef MUI_ICON
    !undef MUI_ICON
  !endif
  !define MUI_ICON "..\public\icon.ico"
  
  !ifdef MUI_UNICON
    !undef MUI_UNICON
  !endif
  !define MUI_UNICON "..\public\icon.ico"
  
  !ifdef MUI_HEADERIMAGE
    !undef MUI_HEADERIMAGE
  !endif
  !define MUI_HEADERIMAGE
  
  !ifdef MUI_HEADERIMAGE_BITMAP
    !undef MUI_HEADERIMAGE_BITMAP
  !endif
  !define MUI_HEADERIMAGE_BITMAP "..\build\installerHeader.bmp"
  
  !ifdef MUI_HEADERIMAGE_RIGHT
    !undef MUI_HEADERIMAGE_RIGHT
  !endif
  !define MUI_HEADERIMAGE_RIGHT
  
  !ifdef MUI_WELCOMEFINISHPAGE_BITMAP
    !undef MUI_WELCOMEFINISHPAGE_BITMAP
  !endif
  !define MUI_WELCOMEFINISHPAGE_BITMAP "..\build\installerSidebar.bmp"
  
  !ifdef MUI_UNWELCOMEFINISHPAGE_BITMAP
    !undef MUI_UNWELCOMEFINISHPAGE_BITMAP
  !endif
  !define MUI_UNWELCOMEFINISHPAGE_BITMAP "..\build\installerSidebar.bmp"
!macroend

!macro preInit
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\Explore Browser"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\Explore Browser"
  SetRegView 32
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\Explore Browser"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\Explore Browser"
!macroend
