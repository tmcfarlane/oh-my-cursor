fn main() {
    // Expose the host target triple so the dev build can locate the per-triple sidecar binary.
    if let Ok(triple) = std::env::var("TARGET") {
        println!("cargo:rustc-env=OMC_TARGET_TRIPLE={triple}");
    }
    tauri_build::build();
}
