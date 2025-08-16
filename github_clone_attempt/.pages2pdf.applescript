
on run argv
  if (count of argv) is not 2 then error "Usage: pages2pdf <input.pages> <output.pdf>"
  set inPath to item 1 of argv
  set outPath to item 2 of argv
  tell application "Pages"
    set doc to open POSIX file inPath
    delay 0.2
    export doc to POSIX file outPath as PDF
    close doc without saving
  end tell
end run
