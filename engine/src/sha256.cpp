#include "sha256.hpp"
#include <fstream>
#include <iomanip>
#include <sstream>
#include <cstring>

namespace compressx {

namespace {

inline uint32_t rotr(uint32_t a, uint32_t b) {
    return (a >> b) | (a << (32 - b));
}

inline uint32_t ch(uint32_t x, uint32_t y, uint32_t z) {
    return (x & y) ^ (~x & z);
}

inline uint32_t maj(uint32_t x, uint32_t y, uint32_t z) {
    return (x & y) ^ (x & z) ^ (y & z);
}

inline uint32_t sig0(uint32_t x) {
    return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22);
}

inline uint32_t sig1(uint32_t x) {
    return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25);
}

inline uint32_t theta0(uint32_t x) {
    return rotr(x, 7) ^ rotr(x, 18) ^ (x >> 3);
}

inline uint32_t theta1(uint32_t x) {
    return rotr(x, 17) ^ rotr(x, 19) ^ (x >> 10);
}

const uint32_t K[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
};

} // anonymous namespace

SHA256::SHA256() : bitlen(0), datalen(0), finalized(false) {
    state[0] = 0x6a09e667;
    state[1] = 0xbb67ae85;
    state[2] = 0x3c6ef372;
    state[3] = 0xa54ff53a;
    state[4] = 0x510e527f;
    state[5] = 0x9b05688c;
    state[6] = 0x1f83d9ab;
    state[7] = 0x5be0cd19;
    digestBytes.resize(32, 0);
}

void SHA256::transform(const uint8_t block[64]) {
    uint32_t m[64];
    for (size_t i = 0, j = 0; i < 16; ++i, j += 4) {
        m[i] = ((uint32_t)block[j] << 24) |
               ((uint32_t)block[j + 1] << 16) |
               ((uint32_t)block[j + 2] << 8) |
               ((uint32_t)block[j + 3]);
    }
    for (size_t i = 16; i < 64; ++i) {
        m[i] = theta1(m[i - 2]) + m[i - 7] + theta0(m[i - 15]) + m[i - 16];
    }

    uint32_t a = state[0];
    uint32_t b = state[1];
    uint32_t c = state[2];
    uint32_t d = state[3];
    uint32_t e = state[4];
    uint32_t f = state[5];
    uint32_t g = state[6];
    uint32_t h = state[7];

    for (size_t i = 0; i < 64; ++i) {
        uint32_t t1 = h + sig1(e) + ch(e, f, g) + K[i] + m[i];
        uint32_t t2 = sig0(a) + maj(a, b, c);
        h = g;
        g = f;
        f = e;
        e = d + t1;
        d = c;
        c = b;
        b = a;
        a = t1 + t2;
    }

    state[0] += a;
    state[1] += b;
    state[2] += c;
    state[3] += d;
    state[4] += e;
    state[5] += f;
    state[6] += g;
    state[7] += h;
}

void SHA256::update(const uint8_t* data, size_t length) {
    for (size_t i = 0; i < length; ++i) {
        buffer[datalen] = data[i];
        datalen++;
        if (datalen == 64) {
            transform(buffer);
            bitlen += 512;
            datalen = 0;
        }
    }
}

void SHA256::update(const std::vector<uint8_t>& data) {
    if (!data.empty()) {
        update(data.data(), data.size());
    }
}

void SHA256::pad() {
    size_t i = datalen;
    if (datalen < 56) {
        buffer[i++] = 0x80;
        while (i < 56) buffer[i++] = 0x00;
    } else {
        buffer[i++] = 0x80;
        while (i < 64) buffer[i++] = 0x00;
        transform(buffer);
        std::memset(buffer, 0, 56);
    }
    bitlen += datalen * 8;
    buffer[63] = (uint8_t)(bitlen);
    buffer[62] = (uint8_t)(bitlen >> 8);
    buffer[61] = (uint8_t)(bitlen >> 16);
    buffer[60] = (uint8_t)(bitlen >> 24);
    buffer[59] = (uint8_t)(bitlen >> 32);
    buffer[58] = (uint8_t)(bitlen >> 40);
    buffer[57] = (uint8_t)(bitlen >> 48);
    buffer[56] = (uint8_t)(bitlen >> 56);
    transform(buffer);
}

void SHA256::revert() {
    for (size_t i = 0; i < 4; ++i) {
        for (size_t j = 0; j < 8; ++j) {
            digestBytes[j * 4 + i] = (uint8_t)((state[j] >> ((3 - i) * 8)) & 0x000000ff);
        }
    }
}

std::vector<uint8_t> SHA256::digest() {
    if (!finalized) {
        pad();
        revert();
        finalized = true;
    }
    return digestBytes;
}

std::string SHA256::hexDigest() {
    std::vector<uint8_t> d = digest();
    std::ostringstream oss;
    for (uint8_t b : d) {
        oss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(b);
    }
    return oss.str();
}

std::string SHA256::hashData(const uint8_t* data, size_t length) {
    SHA256 sha;
    sha.update(data, length);
    return sha.hexDigest();
}

std::vector<uint8_t> SHA256::hashBytes(const uint8_t* data, size_t length) {
    SHA256 sha;
    sha.update(data, length);
    return sha.digest();
}

std::string SHA256::hashFile(const std::string& filepath) {
    std::ifstream file(filepath, std::ios::binary);
    if (!file.is_open()) {
        return "";
    }
    SHA256 sha;
    std::vector<uint8_t> buf(65536);
    while (file.read(reinterpret_cast<char*>(buf.data()), buf.size()) || file.gcount() > 0) {
        sha.update(buf.data(), static_cast<size_t>(file.gcount()));
    }
    return sha.hexDigest();
}

} // namespace compressx
