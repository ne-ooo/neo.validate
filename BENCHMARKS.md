# Performance Benchmarks

This project includes microbenchmarks that compare `neo.validate` with validator.js.

The repository does not contain fixed speed claims. Results change with the CPU, Node.js version, package versions, and input data.

## Run the benchmarks

Use the locked dependency versions:

```bash
lpm install --frozen-lockfile
lpm run bench
```

The benchmark command uses one worker. This setting reduces interference between benchmark groups.

Run benchmarks on an idle computer. Use the same computer and Node.js version for each comparison.

## Benchmark scope

The suite covers these operations:

- Email and URL validation
- Numeric and string validation
- IPv4, IPv6, UUID, and credit-card validation
- JSON and Base64 validation
- HTML escaping and email normalization
- Batches of 100 email, URL, and numeric validations

The benchmark source is in `test/benchmarks/comparison.bench.ts`.

## Comparison rules

neo.validate is not a drop-in replacement for validator.js. The libraries use different option names, defaults, and supported formats.

Use only inputs for which both calls have the same expected result. Map all options before you compare the results.

Before you publish a performance claim, record this information:

- The Git commit
- The operating system and CPU
- The Node.js version
- The locked versions of both packages
- The full benchmark output and its error estimates
- The input set and the mapped options

Run the suite more than once. Do not publish a result when the runs show materially different rankings.

## Interpret the results

Microbenchmarks measure isolated function calls. They do not measure application throughput or latency.

A faster result can also indicate less validation work. Review the accepted and rejected inputs before you compare timing results.

Do not extrapolate one input to all inputs. Valid, invalid, short, long, ASCII, and Unicode inputs can use different code paths.

## Measure the package size

Build the package before you measure it:

```bash
lpm run build
wc -c dist/index.js dist/index.cjs dist/index.d.ts
gzip -9 -c dist/index.js | wc -c
```

The release check enforces an 8 KiB limit for the gzipped ESM entry. This limit detects an unexpected size increase.

Tree-shaking results depend on the consumer bundler and its configuration. Measure a consumer bundle before you publish a tree-shaking claim.

## Release policy

Correctness checks take priority over benchmark results. Run the complete release check before you publish new results:

```bash
lpm run release:check
```

This command runs the type check, tests with coverage, build, package import check, bundle-size limit, and vulnerability audit.
