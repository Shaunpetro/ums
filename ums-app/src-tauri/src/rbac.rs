// Path: ums-app/src-tauri/src/rbac.rs
// Purpose: Role-to-capability mapping per DEC-055 and DEC-057. Uses read:X / write:X.

pub fn capabilities_for_role(role: &str) -> Vec<String> {
    let caps: &[&str] = match role {
        "super_admin" => &[
            "read:all", "write:all", "admin:profile", "admin:finance",
            "write:accounting", "write:executive", "write:finance",
            "write:tenders", "write:management", "write:hr",
        ],
        "devops_admin" => &[
            "read:all", "write:all", "admin:profile", "admin:finance",
            "write:accounting", "write:executive", "write:finance",
            "write:tenders", "write:management", "write:hr",
            "read:devops", "write:devops",
        ],
        "finance_manager" => &[
            "read:all", "write:accounting", "write:finance",
            "write:management", "write:executive",
            "admin:profile", "admin:finance",
        ],
        "accountant" => &[
            "read:all", "write:accounting", "write:finance",
            "admin:finance", "read:profile",
        ],
        "pa" => &[
            "read:all", "write:executive", "write:finance",
            "write:tenders", "write:management", "read:profile",
        ],
        "pm" => &[
            "read:all", "write:management", "read:tenders", "read:finance",
            "admin:profile", "admin:finance", "read:profile",
        ],
        "technical_manager" => &[
            "read:all", "write:management", "write:tenders",
            "read:finance", "read:profile",
        ],
        "hr" => &[
            "read:all", "write:hr", "read:profile",
        ],
        _ => &["read:all"],
    };
    caps.iter().map(|s| s.to_string()).collect()
}