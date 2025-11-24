# Clock Synchronization for Realtime Games

## Purpose / Problem Statement

Clients and server run separate clocks and experience variable one-way latency and jitter. To correctly interpret server snapshots and pick interpolation targets (and to compute how far the client lags the server in ticks), clients must estimate:

- A stable **clock offset** between server time and client time.
- A robust **one-way latency** estimate (usually RTT/2) that is not corrupted by TCP retransmissions or extreme jitter.

## Design Goals (Practical)

- **Accuracy**: ~≤150 ms typical.
- **Simplicity**: Implementable over TCP/WebSocket.
- **Robustness**: Ignore TCP retransmit artifacts and extreme jitter.
- **Safety**: Do **not** repeatedly jump the system clock; keep a `serverTimeOffset` variable.
- **Integration**: Server snapshots include `serverTick` and `serverTime`.

## High-level Algorithm

1.  **Initial Sync**: On connect, perform K (6-12) ping–pong exchanges.
2.  **Filter**: Sort samples by RTT. Discard outliers (RTT > Median + 1σ).
3.  **Calculate**: Compute initial `offset` and `smoothedRTT` from remaining samples.
4.  **Maintenance**: Periodically ping (0.5-5s) and smooth with Exponential Moving Average (EMA).

## Detailed Procedure

### A — Initial Sync (On Connect)
1.  Send `ping` with `t0`.
2.  Receive `pong` with `serverTime` at `t1`.
3.  `rtt = t1 - t0`.
4.  `estServerNow = serverTime + rtt/2`.
5.  `offsetSample = estServerNow - t1`.
6.  Repeat K times.
7.  Filter outliers > Median + StdDev.
8.  Average remaining offsets.

### B — Using the Offset
When a snapshot arrives with `snap.serverTime`:
1.  `t_recv = performance.now()`.
2.  `estimatedServerNow = t_recv + offset`.
3.  `targetServerRenderTime = estimatedServerNow - interpDelay`.
4.  Interpolate entities between snapshots bracketing `targetServerRenderTime`.

## Packet Contents

**Server → Client (Snapshot/Pong)**
- `type`: "snapshot" | "pong"
- `serverTick`: uint32
- `serverTime`: float64
- `lastProcessedInputSeq`: uint32 (for reconciliation)

**Client → Server (Ping/Input)**
- `type`: "ping" | "input"
- `clientSendTime`: float64
- `inputSeq`: uint32

## References
- [Valve Source Multiplayer Networking](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking)
- [Gabriela Gambetta: Client-Server Game Architecture](https://gabrielgambetta.com/client-server-game-architecture.html)

