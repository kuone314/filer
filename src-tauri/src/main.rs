#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[macro_use]
extern crate serde;

use std::fs;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_entries, adjust_addressbar_str,])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

///////////////////////////////////////////////////////////////////////////////////////////////////
#[derive(Debug, Serialize, Deserialize)]
struct AdjustedAddressbarStr {
    dir: String,
}
#[tauri::command]
fn adjust_addressbar_str(str: &str) -> Result<AdjustedAddressbarStr, String> {
    let file_info = match fs::metadata(str) {
        Ok(f) => f,
        Err(_) => return Err("unfond".to_string()),
    };

    if file_info.is_file() {
        use std::path::Path;
        let parent = match Path::new(str).parent() {
            Some(p) => p,
            None => return Err("unfond".to_string()),
        };
        return Ok(AdjustedAddressbarStr {
            dir: parent.as_os_str().to_str().unwrap_or_default().to_string(),
        });
    }

    if file_info.is_dir() {
        return Ok(AdjustedAddressbarStr {
            dir: str.to_string(),
        });
    }

    return Err("unfond".to_string());
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// tauriコマンドとして扱うには、JSONへ変換が出来る必要があるため、
// クラスを用意している。
#[derive(Serialize)]
#[serde(tag = "type")]
enum Entry {
    #[serde(rename = "file")]
    File { name: String, path: String },
    #[serde(rename = "dir")]
    Dir { name: String, path: String },
}

#[tauri::command]
fn get_entries(path: &str) -> Result<Vec<Entry>, String> {
    let entries = fs::read_dir(path).map_err(|e| format!("{}", e))?;

    let res = entries
        .filter_map(|entry| -> Option<Entry> {
            let entry = entry.ok()?;
            let name = entry.file_name().to_string_lossy().to_string();
            let path = entry.path().to_string_lossy().to_string();
            let type_ = entry.file_type().ok()?;

            if type_.is_dir() {
                Some(Entry::Dir { name, path })
            } else if type_.is_file() {
                Some(Entry::File { name, path })
            } else {
                None
            }
        })
        .collect();

    Ok(res)
}
