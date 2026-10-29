#include "../src/compressx_engine.hpp"
#include <iostream>
#include <vector>
#include <string>
#include <cassert>
#include <fstream>
#include <random>
#include <filesystem>

namespace fs = std::filesystem;
using namespace compressx;

int testsPassed = 0;
int testsFailed = 0;

void runTest(const std::string& testName, bool condition) {
    if (condition) {
        std::cout << "[PASS] " << testName << "\n";
        testsPassed++;
    } else {
        std::cerr << "[FAIL] " << testName << "\n";
        testsFailed++;
    }
}

void writeTestFile(const std::string& path, const std::vector<uint8_t>& data) {
    std::ofstream out(path, std::ios::binary);
    if (!data.empty()) {
        out.write(reinterpret_cast<const char*>(data.data()), data.size());
    }
    out.close();
}

std::vector<uint8_t> readTestFile(const std::string& path) {
    std::ifstream in(path, std::ios::binary | std::ios::ate);
    if (!in.is_open()) return {};
    std::streamsize sz = in.tellg();
    if (sz <= 0) return {};
    in.seekg(0, std::ios::beg);
    std::vector<uint8_t> data(static_cast<size_t>(sz));
    in.read(reinterpret_cast<char*>(data.data()), sz);
    return data;
}

int main() {
    std::cout << "=====================================================\n";
    std::cout << "CompressX Engine Automated Test Suite\n";
    std::cout << "Testing all 18 mandatory specifications and edge cases\n";
    std::cout << "=====================================================\n\n";

    fs::create_directories("test_tmp");

    // Helper lambda for roundtrip test
    auto testRoundtrip = [](const std::string& name, const std::vector<uint8_t>& inputData, AlgorithmType algo) -> bool {
        std::string inPath = "test_tmp/input_" + name + ".dat";
        std::string cpxPath = "test_tmp/out_" + name + ".cpx";
        std::string recPath = "test_tmp/rec_" + name + ".dat";

        writeTestFile(inPath, inputData);

        CompressionResult cRes = CompressXEngine::compressFile(inPath, cpxPath, algo, "orig_" + name + ".dat");
        if (!cRes.success) {
            std::cerr << "  Compression error: " << cRes.errorMessage << "\n";
            return false;
        }

        DecompressionResult dRes = CompressXEngine::decompressFile(cpxPath, recPath);
        if (!dRes.success) {
            std::cerr << "  Decompression error: " << dRes.errorMessage << "\n";
            return false;
        }

        if (!dRes.checksumVerified) {
            std::cerr << "  Checksum verification failed!\n";
            return false;
        }

        std::vector<uint8_t> recData = readTestFile(recPath);
        if (recData.size() != inputData.size()) {
            std::cerr << "  Size mismatch: original " << inputData.size() << " vs recovered " << recData.size() << "\n";
            return false;
        }

        return (recData == inputData);
    };

    // Test 1: Empty input (0 bytes)
    {
        std::vector<uint8_t> empty;
        bool okH = testRoundtrip("empty_huffman", empty, AlgorithmType::HUFFMAN);
        bool okR = testRoundtrip("empty_rle", empty, AlgorithmType::RLE);
        bool okS = testRoundtrip("empty_store", empty, AlgorithmType::STORE);
        bool okA = testRoundtrip("empty_auto", empty, AlgorithmType::AUTO);
        runTest("Test 1: Empty input (0 bytes) roundtrip across all modes", okH && okR && okS && okA);
    }

    // Test 2: Single-byte input (1 byte)
    {
        std::vector<uint8_t> single = {'X'};
        bool okH = testRoundtrip("single_huffman", single, AlgorithmType::HUFFMAN);
        bool okR = testRoundtrip("single_rle", single, AlgorithmType::RLE);
        bool okA = testRoundtrip("single_auto", single, AlgorithmType::AUTO);
        runTest("Test 2: Single-byte input roundtrip", okH && okR && okA);
    }

    // Test 3: Repeated bytes (500 identical 'A's)
    {
        std::vector<uint8_t> repeated(500, 'A');
        bool okH = testRoundtrip("repeated_huffman", repeated, AlgorithmType::HUFFMAN);
        bool okR = testRoundtrip("repeated_rle", repeated, AlgorithmType::RLE);
        runTest("Test 3: Repeated bytes (500 identical bytes)", okH && okR);
    }

    // Test 4: All 256 possible byte values (0x00 to 0xFF)
    {
        std::vector<uint8_t> all256;
        for (int i = 0; i < 256; ++i) all256.push_back(static_cast<uint8_t>(i));
        bool okH = testRoundtrip("all256_huffman", all256, AlgorithmType::HUFFMAN);
        bool okR = testRoundtrip("all256_rle", all256, AlgorithmType::RLE);
        runTest("Test 4: All 256 byte values present", okH && okR);
    }

    // Test 5: Random binary input
    {
        std::vector<uint8_t> randomData(50000);
        std::mt19937 rng(42);
        for (size_t i = 0; i < randomData.size(); ++i) {
            randomData[i] = static_cast<uint8_t>(rng() % 256);
        }
        bool okH = testRoundtrip("random_huffman", randomData, AlgorithmType::HUFFMAN);
        bool okR = testRoundtrip("random_rle", randomData, AlgorithmType::RLE);
        runTest("Test 5: Random binary input (50,000 bytes)", okH && okR);
    }

    // Test 6: Text containing punctuation and whitespace
    {
        std::string text = "CompressX: Universal File Compression and Decompression System!\n"
                           "Demonstrating Huffman Coding, Min-Heap, Binary Trees, and RLE.\n"
                           "\tIndent 1\n\t\tIndent 2\r\nSpecial: @#$%^&*()_+~`|}{[]:;?><,./\n";
        std::vector<uint8_t> textBytes(text.begin(), text.end());
        bool okH = testRoundtrip("text_huffman", textBytes, AlgorithmType::HUFFMAN);
        bool okR = testRoundtrip("text_rle", textBytes, AlgorithmType::RLE);
        runTest("Test 6: Text with punctuation, tabs, and newlines", okH && okR);
    }

    // Test 7: UTF-8 text (multi-byte sequences)
    {
        std::string utf8Str = "CompressX 🚀 — 压缩, 압축, Сжатие, الضغط, Réduire, Größe! 🌟✨🎉";
        std::vector<uint8_t> utf8Bytes(utf8Str.begin(), utf8Str.end());
        bool okH = testRoundtrip("utf8_huffman", utf8Bytes, AlgorithmType::HUFFMAN);
        bool okA = testRoundtrip("utf8_auto", utf8Bytes, AlgorithmType::AUTO);
        runTest("Test 7: UTF-8 multi-byte characters and emoji", okH && okA);
    }

    // Test 8: Image/media simulation (structured patterns + binary gradients)
    {
        std::vector<uint8_t> mediaSim(64000);
        for (size_t i = 0; i < mediaSim.size(); ++i) {
            mediaSim[i] = static_cast<uint8_t>((i % 256) ^ ((i / 256) % 32));
        }
        bool okH = testRoundtrip("media_huffman", mediaSim, AlgorithmType::HUFFMAN);
        runTest("Test 8: Media pattern simulation roundtrip", okH);
    }

    // Test 9: High-entropy already-compressed simulation
    {
        std::vector<uint8_t> highEntropy(20000);
        std::mt19937 rng(1337);
        for (size_t i = 0; i < highEntropy.size(); ++i) highEntropy[i] = static_cast<uint8_t>(rng() % 256);
        bool okA = testRoundtrip("entropy_auto", highEntropy, AlgorithmType::AUTO);
        runTest("Test 9: High-entropy already-compressed simulation", okA);
    }

    // Test 10: Large file roundtrip (2 Megabytes)
    {
        std::vector<uint8_t> large(2 * 1024 * 1024);
        for (size_t i = 0; i < large.size(); ++i) {
            large[i] = static_cast<uint8_t>((i * 7 + 13) % 256);
        }
        bool ok = testRoundtrip("large_2mb", large, AlgorithmType::HUFFMAN);
        runTest("Test 10: Large file roundtrip (2 MB)", ok);
    }

    // Test 11: Malformed .cpx containers (corrupted magic bytes)
    {
        std::vector<uint8_t> badMagic = {'B', 'A', 'D', '0', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0};
        badMagic.resize(120, 0);
        writeTestFile("test_tmp/bad_magic.cpx", badMagic);
        DecompressionResult res = CompressXEngine::decompressFile("test_tmp/bad_magic.cpx", "test_tmp/bad_out.dat");
        runTest("Test 11: Malformed container signature rejected safely", !res.success);
    }

    // Test 12: Truncated compressed file
    {
        std::string sample = "Truncation test data payload string that should be cut off.";
        std::vector<uint8_t> s(sample.begin(), sample.end());
        writeTestFile("test_tmp/trunc_in.dat", s);
        CompressXEngine::compressFile("test_tmp/trunc_in.dat", "test_tmp/trunc_full.cpx", AlgorithmType::HUFFMAN);

        std::vector<uint8_t> cpxBytes = readTestFile("test_tmp/trunc_full.cpx");
        cpxBytes.resize(cpxBytes.size() / 2); // Cut off half the file
        writeTestFile("test_tmp/trunc_half.cpx", cpxBytes);

        DecompressionResult res = CompressXEngine::decompressFile("test_tmp/trunc_half.cpx", "test_tmp/trunc_out.dat");
        runTest("Test 12: Truncated compressed file rejected safely", !res.success);
    }

    // Test 13: Corrupted checksums
    {
        std::string sample = "Integrity check test string!";
        std::vector<uint8_t> s(sample.begin(), sample.end());
        writeTestFile("test_tmp/corrupt_in.dat", s);
        CompressXEngine::compressFile("test_tmp/corrupt_in.dat", "test_tmp/corrupt.cpx", AlgorithmType::HUFFMAN);

        std::vector<uint8_t> cpxBytes = readTestFile("test_tmp/corrupt.cpx");
        // Flip one bit in payload
        if (cpxBytes.size() > 40) {
            cpxBytes[35] ^= 0xFF;
        }
        writeTestFile("test_tmp/corrupt_flipped.cpx", cpxBytes);

        DecompressionResult res = CompressXEngine::decompressFile("test_tmp/corrupt_flipped.cpx", "test_tmp/corrupt_out.dat");
        runTest("Test 13: Bit corruption and checksum mismatch detected", !res.success);
    }

    // Test 14: Invalid Huffman metadata / invalid algorithm identifier
    {
        std::vector<uint8_t> dummy(100, 0);
        writeTestFile("test_tmp/bad_algo.cpx", dummy);
        DecompressionResult res = CompressXEngine::decompressFile("test_tmp/bad_algo.cpx", "test_tmp/bad_algo.dat");
        runTest("Test 14: Invalid container metadata rejected safely", !res.success);
    }

    // Test 15: RLE runs exceeding maximum record length (> 130 bytes, e.g. 1000 identical bytes)
    {
        std::vector<uint8_t> longRun(1000, 0x42);
        bool okR = testRoundtrip("long_run_1000", longRun, AlgorithmType::RLE);
        runTest("Test 15: RLE runs exceeding maximum single record length (1000 bytes)", okR);
    }

    // Test 16: Safe filename handling and path traversal prevention
    {
        std::string unsafe1 = "../../../etc/passwd";
        std::string unsafe2 = "C:\\Windows\\System32\\cmd.exe";
        std::string unsafe3 = "test/sub/file?.txt";
        std::string clean1 = Container::sanitizeFilename(unsafe1);
        std::string clean2 = Container::sanitizeFilename(unsafe2);
        std::string clean3 = Container::sanitizeFilename(unsafe3);
        bool safe = (clean1 == "passwd") && (clean2 == "cmd.exe") && (clean3.find('/') == std::string::npos && clean3.find('?') == std::string::npos);
        runTest("Test 16: Path traversal prevention and filename sanitization", safe);
    }

    // Test 17: Cancellation and invalid paths handled cleanly without crashes
    {
        DecompressionResult res = CompressXEngine::decompressFile("non_existent_file_12345.cpx", "output.dat");
        runTest("Test 17: Non-existent file handled cleanly", !res.success && !res.errorMessage.empty());
    }

    // Test 18: Automatic mode when compression increases file size
    {
        // 10 random bytes will have overhead in Huffman and RLE containers. Auto must cleanly store or select smallest representation
        std::vector<uint8_t> tinyNoise = {0x12, 0x98, 0x34, 0xfe, 0x5a, 0x11, 0x77, 0xaa, 0xbc, 0x03};
        writeTestFile("test_tmp/tiny.dat", tinyNoise);
        CompressionResult cRes = CompressXEngine::compressFile("test_tmp/tiny.dat", "test_tmp/tiny.cpx", AlgorithmType::AUTO, "tiny.dat");
        DecompressionResult dRes = CompressXEngine::decompressFile("test_tmp/tiny.cpx", "test_tmp/tiny_rec.dat");
        std::vector<uint8_t> rec = readTestFile("test_tmp/tiny_rec.dat");
        runTest("Test 18: Auto mode preserves small files and recovers exact bytes", cRes.success && dRes.success && rec == tinyNoise);
    }

    std::cout << "\n=====================================================\n";
    std::cout << "Test Results: " << testsPassed << " Passed, " << testsFailed << " Failed.\n";
    std::cout << "=====================================================\n";

    // Clean up temporary test files
    std::error_code ec;
    fs::remove_all("test_tmp", ec);

    return (testsFailed == 0) ? 0 : 1;
}
