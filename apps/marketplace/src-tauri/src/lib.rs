// Tauri desktop shell for The Behavior Catalog.
//
// The web frontend is unchanged; it talks to the SAME engine bridge that the browser dev build
// uses — but here the bridge runs as a bundled, node-free sidecar binary (Bun-compiled from
// bridge/server.mjs) that this shell spawns on startup and kills on exit. The only desktop-only
// surface is a native folder picker exposed via the `pick_folder` command.
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

/// Holds the spawned bridge sidecar so we can terminate it when the app exits.
struct Sidecar(Mutex<Option<Child>>);

/// Native folder picker — replaces the web build's path text field.
#[tauri::command]
fn pick_folder(app: tauri::AppHandle) -> Option<String> {
    use tauri_plugin_dialog::DialogExt;
    app.dialog()
        .file()
        .blocking_pick_folder()
        .and_then(|fp| fp.into_path().ok())
        .map(|p| p.to_string_lossy().to_string())
}

/// Locate the sidecar binary: per-triple under binaries/ in dev, next to the exe in a bundle.
fn sidecar_binary() -> PathBuf {
    if cfg!(debug_assertions) {
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("binaries")
            .join(format!("omc-bridge-{}", env!("OMC_TARGET_TRIPLE")))
    } else {
        std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|d| d.join("omc-bridge")))
            .unwrap_or_else(|| PathBuf::from("omc-bridge"))
    }
}

/// Where the bridge finds pack data (registry + packs). OMC_ROOT env wins; else the repo root
/// in dev, or the bundled `data` resource dir in a packaged build.
fn omc_root(app: &tauri::App) -> String {
    if let Ok(root) = std::env::var("OMC_ROOT") {
        return root;
    }
    if cfg!(debug_assertions) {
        return PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../..")
            .canonicalize()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
    }
    app.path()
        .resource_dir()
        .map(|d| d.join("data").to_string_lossy().to_string())
        .unwrap_or_default()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Sidecar(Mutex::new(None)))
        .setup(|app| {
            let bin = sidecar_binary();
            let root = omc_root(app);
            match Command::new(&bin)
                .env("OMC_ROOT", &root)
                .env("OMC_BRIDGE_PORT", "8787")
                .spawn()
            {
                Ok(child) => {
                    if let Some(state) = app.try_state::<Sidecar>() {
                        *state.0.lock().unwrap() = Some(child);
                    }
                }
                Err(e) => eprintln!("omc: failed to start bridge sidecar {}: {e}", bin.display()),
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![pick_folder])
        .build(tauri::generate_context!())
        .expect("error building The Behavior Catalog")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<Sidecar>() {
                    if let Some(mut child) = state.0.lock().unwrap().take() {
                        let _ = child.kill();
                    }
                }
            }
        });
}
