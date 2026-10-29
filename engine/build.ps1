$binDir = "C:\Users\Ayush Bansal\AppData\Local\Microsoft\WinGet\Packages\MartinStorsjo.LLVM-MinGW.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\llvm-mingw-20261020-ucrt-x86_64\bin"
$compiler = "$binDir\x86_64-w64-mingw32-g++.exe"

if (!(Test-Path $compiler)) {
    Write-Error "Compiler not found at $compiler"
    exit 1
}

Write-Host "Compiling CompressX Engine (static)..."
& $compiler -O3 -std=c++17 -Wall -Wextra -static `
    src/sha256.cpp `
    src/huffman.cpp `
    src/rle.cpp `
    src/container.cpp `
    src/compressx_engine.cpp `
    src/main.cpp `
    -o ../bin/compressx.exe

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to compile compressx.exe"
    exit $LASTEXITCODE
}
Write-Host "Successfully compiled bin/compressx.exe!"

Write-Host "Compiling Automated Test Runner (static)..."
& $compiler -O3 -std=c++17 -Wall -Wextra -static `
    src/sha256.cpp `
    src/huffman.cpp `
    src/rle.cpp `
    src/container.cpp `
    src/compressx_engine.cpp `
    tests/test_runner.cpp `
    -o ../bin/test_runner.exe

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to compile test_runner.exe"
    exit $LASTEXITCODE
}
Write-Host "Successfully compiled bin/test_runner.exe!"
