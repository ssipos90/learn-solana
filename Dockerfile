FROM debian:stable-slim

ARG SOLANA_URL=https://github.com/solana-labs/solana/releases/download/v1.14.4/solana-release-x86_64-unknown-linux-gnu.tar.bz2

RUN set -eu; \
    apt-get update; \
    apt-get -y install --no-install-recommends \
        bzip2 \
        ca-certificates \
        curl; \
    exit

RUN useradd -mU solana
USER solana
WORKDIR /home/solana

RUN set -eu; \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y -q; \
    curl --proto '=https' --tlsv1.2 -sSf -o solana-release.tar.bz2 "$SOLANA_URL"; \
    tar jxf solana-release.tar.bz2

ENV PATH=$PWD/.cargo.bin:$PWD/solana-release/bin:$PATH

