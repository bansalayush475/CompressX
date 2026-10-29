#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace compressx {

class SHA256 {
public:
    SHA256();
    void update(const uint8_t* data, size_t length);
    void update(const std::vector<uint8_t>& data);
    std::vector<uint8_t> digest();
    std::string hexDigest();

    static std::string hashData(const uint8_t* data, size_t length);
    static std::string hashFile(const std::string& filepath);
    static std::vector<uint8_t> hashBytes(const uint8_t* data, size_t length);

private:
    void transform(const uint8_t block[64]);
    void pad();
    void revert();

    uint32_t state[8];
    uint64_t bitlen;
    uint8_t buffer[64];
    size_t datalen;
    bool finalized;
    std::vector<uint8_t> digestBytes;
};

} // namespace compressx
