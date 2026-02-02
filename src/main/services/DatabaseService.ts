import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  readFileSync,
  writeFileSync
} from 'fs'

export class DatabaseService {
  private static instance: DatabaseService
  private db: SqlJsDatabase | null = null
  private readonly DB_NAME = 'psoh-offline.db'
  private readonly BACKUP_DIR = 'backups'
  private readonly MAX_BACKUPS = 5
  private checkpointInterval: NodeJS.Timeout | null = null
  private dbPath: string = ''
  private saveInterval: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async initialize(): Promise<void> {
    const userDataPath = app.getPath('userData')
    const dbDir = join(userDataPath, 'database')
    const backupDir = join(userDataPath, this.BACKUP_DIR)

    // Create database directory if not exists
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }

    // Create backup directory if not exists
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true })
    }

    this.dbPath = join(dbDir, this.DB_NAME)

    // Initialize sql.js
    const SQL = await initSqlJs()

    // Load existing database or create new one
    if (existsSync(this.dbPath)) {
      const fileBuffer = readFileSync(this.dbPath)
      this.db = new SQL.Database(fileBuffer)
    } else {
      this.db = new SQL.Database()
    }

    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON')

    // Run migrations
    await this.runMigrations()

    // Start periodic save (every 30 seconds to persist changes)
    this.startPeriodicSave()

    // Create initial backup
    this.createBackup()
  }

  // Periodic save to ensure data persistence
  private startPeriodicSave(): void {
    this.saveInterval = setInterval(() => {
      this.saveToFile()
    }, 30 * 1000) // Every 30 seconds
  }

  // Save database to file
  saveToFile(): void {
    if (this.db && this.dbPath) {
      try {
        const data = this.db.export()
        const buffer = Buffer.from(data)
        writeFileSync(this.dbPath, buffer)
        console.log('Database saved to file')
      } catch (error) {
        console.error('Save to file failed:', error)
      }
    }
  }

  // Checkpoint (for sql.js this is just saving to file)
  checkpoint(): void {
    this.saveToFile()
  }

  // Create backup of database
  createBackup(): void {
    if (!this.db) return

    try {
      const userDataPath = app.getPath('userData')
      const backupDir = join(userDataPath, this.BACKUP_DIR)

      // Save current state first
      this.saveToFile()

      if (!existsSync(this.dbPath)) return

      // Create backup with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = join(backupDir, `psoh-offline-${timestamp}.db`)

      copyFileSync(this.dbPath, backupPath)
      console.log(`Backup created: ${backupPath}`)

      // Clean old backups (keep only MAX_BACKUPS)
      this.cleanOldBackups()
    } catch (error) {
      console.error('Backup failed:', error)
    }
  }

  // Clean old backups keeping only recent ones
  private cleanOldBackups(): void {
    try {
      const userDataPath = app.getPath('userData')
      const backupDir = join(userDataPath, this.BACKUP_DIR)

      const files = readdirSync(backupDir)
        .filter((f) => f.endsWith('.db'))
        .map((f) => ({
          name: f,
          path: join(backupDir, f),
          time: statSync(join(backupDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)

      // Remove old backups
      files.slice(this.MAX_BACKUPS).forEach((file) => {
        unlinkSync(file.path)
        console.log(`Old backup removed: ${file.name}`)
      })
    } catch (error) {
      console.error('Clean backups failed:', error)
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    // Create migrations table if not exists
    this.db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Run schema migrations
    const migrations = [
      {
        name: '001_initial_schema',
        sql: `
          -- Reference data tables
          CREATE TABLE IF NOT EXISTS ref_spesies (
            id INTEGER PRIMARY KEY,
            kod TEXT,
            nama TEXT,
            sync_at DATETIME
          );

          CREATE TABLE IF NOT EXISTS ref_negeri (
            id INTEGER PRIMARY KEY,
            kod TEXT,
            nama TEXT,
            sync_at DATETIME
          );

          CREATE TABLE IF NOT EXISTS ref_daerah (
            id INTEGER PRIMARY KEY,
            negeri_id INTEGER,
            kod TEXT,
            nama TEXT,
            sync_at DATETIME
          );

          CREATE TABLE IF NOT EXISTS ref_daerah_hutan (
            id INTEGER PRIMARY KEY,
            negeri_id INTEGER,
            kod TEXT,
            nama TEXT,
            sync_at DATETIME
          );

          CREATE TABLE IF NOT EXISTS ref_hutan_simpan (
            id INTEGER PRIMARY KEY,
            negeri_id INTEGER,
            kod TEXT,
            nama TEXT,
            sync_at DATETIME
          );

          -- Assignment data
          CREATE TABLE IF NOT EXISTS tp_pokok_a (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            remote_id TEXT UNIQUE,
            permohonan_id INTEGER,
            status_id INTEGER,
            kaedah TEXT,
            no_ruj_surat_lulus TEXT,
            status_tanah TEXT,
            daerah TEXT,
            kompartmen TEXT,
            sync_status TEXT DEFAULT 'synced',
            sync_at DATETIME
          );

          -- Recording tables
          CREATE TABLE IF NOT EXISTS tp_tag_pokok_a (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            remote_id TEXT,
            tp_pokok_a_id INTEGER,
            jenis_tag TEXT,
            no_tag TEXT,
            kod_spesies TEXT,
            ukurlilit_paras_dada REAL,
            kualiti TEXT,
            catatan TEXT,
            latitude REAL,
            longitude REAL,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            sync_status TEXT DEFAULT 'pending',
            sync_at DATETIME,
            sync_retry_count INTEGER DEFAULT 0,
            sync_error TEXT,
            FOREIGN KEY (tp_pokok_a_id) REFERENCES tp_pokok_a(id)
          );

          CREATE TABLE IF NOT EXISTS tp_lokasi_penandaan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            remote_id TEXT,
            tp_pokok_a_id INTEGER,
            tarikh DATE,
            masa_mula TIME,
            masa_tamat TIME,
            latitude REAL,
            longitude REAL,
            catatan TEXT,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            sync_status TEXT DEFAULT 'pending',
            sync_at DATETIME,
            sync_retry_count INTEGER DEFAULT 0,
            sync_error TEXT,
            FOREIGN KEY (tp_pokok_a_id) REFERENCES tp_pokok_a(id)
          );

          CREATE TABLE IF NOT EXISTS tp_aktiviti_penandaan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            remote_id TEXT,
            tp_pokok_a_id INTEGER,
            tarikh DATE,
            aktiviti TEXT,
            catatan TEXT,
            recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            sync_status TEXT DEFAULT 'pending',
            sync_at DATETIME,
            sync_retry_count INTEGER DEFAULT 0,
            sync_error TEXT,
            FOREIGN KEY (tp_pokok_a_id) REFERENCES tp_pokok_a(id)
          );

          -- Sync tracking
          CREATE TABLE IF NOT EXISTS sync_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT,
            table_name TEXT,
            record_id INTEGER,
            status TEXT,
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          -- Form drafts for auto-save and recovery
          CREATE TABLE IF NOT EXISTS form_drafts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            form_type TEXT NOT NULL,
            assignment_id INTEGER,
            data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(form_type, assignment_id)
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_tp_tag_sync_status ON tp_tag_pokok_a(sync_status);
          CREATE INDEX IF NOT EXISTS idx_tp_lokasi_sync_status ON tp_lokasi_penandaan(sync_status);
          CREATE INDEX IF NOT EXISTS idx_tp_aktiviti_sync_status ON tp_aktiviti_penandaan(sync_status);
          CREATE INDEX IF NOT EXISTS idx_form_drafts_type ON form_drafts(form_type);
          CREATE INDEX IF NOT EXISTS idx_form_drafts_assignment ON form_drafts(assignment_id);
        `
      },
      {
        name: '002_add_daerah_hutan',
        sql: `
          CREATE TABLE IF NOT EXISTS ref_daerah_hutan (
            id INTEGER PRIMARY KEY,
            negeri_id INTEGER,
            kod TEXT,
            nama TEXT,
            sync_at DATETIME
          );
        `
      }
    ]

    for (const migration of migrations) {
      const result = this.db.exec(
        `SELECT * FROM migrations WHERE name = '${migration.name}'`
      )

      if (result.length === 0 || result[0].values.length === 0) {
        // Split SQL by semicolons and run each statement
        const statements = migration.sql.split(';').filter((s) => s.trim())
        for (const stmt of statements) {
          if (stmt.trim()) {
            try {
              this.db.run(stmt)
            } catch (error) {
              console.error(`Migration error in statement: ${stmt}`, error)
            }
          }
        }
        this.db.run(`INSERT INTO migrations (name) VALUES ('${migration.name}')`)
        console.log(`Migration ${migration.name} executed`)
      }
    }

    // Save after migrations
    this.saveToFile()
  }

  getDatabase(): SqlJsDatabase {
    if (!this.db) throw new Error('Database not initialized')
    return this.db
  }

  close(): void {
    // Stop save interval
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
      this.saveInterval = null
    }

    // Stop checkpoint interval
    if (this.checkpointInterval) {
      clearInterval(this.checkpointInterval)
      this.checkpointInterval = null
    }

    if (this.db) {
      // Final save before closing
      this.saveToFile()
      // Create backup before closing
      this.createBackup()
      this.db.close()
      this.db = null
    }
  }

  // Helper to run query and get results as array of objects
  private query(sql: string, params: any[] = []): any[] {
    const db = this.getDatabase()
    try {
      const stmt = db.prepare(sql)
      if (params.length > 0) {
        stmt.bind(params)
      }
      const results: any[] = []
      while (stmt.step()) {
        results.push(stmt.getAsObject())
      }
      stmt.free()
      return results
    } catch (error) {
      console.error('Query error:', sql, error)
      return []
    }
  }

  // Helper to run single query and get one result
  private queryOne(sql: string, params: any[] = []): any | null {
    const results = this.query(sql, params)
    return results.length > 0 ? results[0] : null
  }

  // Helper to run statement (insert/update/delete)
  private run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
    const db = this.getDatabase()
    try {
      db.run(sql, params)
      const lastId = this.queryOne('SELECT last_insert_rowid() as id')
      const changes = this.queryOne('SELECT changes() as count')
      return {
        lastInsertRowid: lastId?.id || 0,
        changes: changes?.count || 0
      }
    } catch (error) {
      console.error('Run error:', sql, error)
      return { lastInsertRowid: 0, changes: 0 }
    }
  }

  // Save form draft for auto-recovery
  saveDraft(formType: string, assignmentId: number, data: any): void {
    const jsonData = JSON.stringify(data)
    this.run(
      `INSERT OR REPLACE INTO form_drafts (form_type, assignment_id, data, updated_at)
       VALUES (?, ?, ?, datetime('now'))`,
      [formType, assignmentId, jsonData]
    )
    // Immediate save for draft persistence
    this.saveToFile()
  }

  // Get saved draft
  getDraft(formType: string, assignmentId: number): any | null {
    const result = this.queryOne(
      'SELECT data FROM form_drafts WHERE form_type = ? AND assignment_id = ?',
      [formType, assignmentId]
    )

    if (result) {
      try {
        return JSON.parse(result.data)
      } catch {
        return null
      }
    }
    return null
  }

  // Clear draft after successful save
  clearDraft(formType: string, assignmentId: number): void {
    this.run('DELETE FROM form_drafts WHERE form_type = ? AND assignment_id = ?', [
      formType,
      assignmentId
    ])
  }

  // Get all drafts for recovery
  getAllDrafts(): any[] {
    return this.query('SELECT * FROM form_drafts ORDER BY updated_at DESC')
  }

  // Assignment operations
  getAssignments(): any[] {
    return this.query('SELECT * FROM tp_pokok_a ORDER BY id DESC')
  }

  getAssignment(id: number): any {
    return this.queryOne('SELECT * FROM tp_pokok_a WHERE id = ?', [id])
  }

  insertAssignment(data: any): number {
    // Ensure all values are valid types for sql.js (convert undefined to null)
    const safeValue = (val: any): any => (val === undefined ? null : val)
    
    // Check if assignment already exists
    const existing = this.queryOne(
      'SELECT id FROM tp_pokok_a WHERE remote_id = ?',
      [safeValue(data.remote_id)]
    )
    
    if (existing) {
      // Check if there are pending (unsynced) child records for this assignment
      const pendingTags = this.queryOne(
        "SELECT COUNT(*) as count FROM tp_tag_pokok_a WHERE tp_pokok_a_id = ? AND sync_status = 'pending'",
        [existing.id]
      )
      const pendingLokasi = this.queryOne(
        "SELECT COUNT(*) as count FROM tp_lokasi_penandaan WHERE tp_pokok_a_id = ? AND sync_status = 'pending'",
        [existing.id]
      )
      const pendingAktiviti = this.queryOne(
        "SELECT COUNT(*) as count FROM tp_aktiviti_penandaan WHERE tp_pokok_a_id = ? AND sync_status = 'pending'",
        [existing.id]
      )
      
      const hasPendingRecords = 
        (pendingTags?.count || 0) > 0 || 
        (pendingLokasi?.count || 0) > 0 || 
        (pendingAktiviti?.count || 0) > 0
      
      if (hasPendingRecords) {
        // Don't overwrite - just update non-critical fields that won't affect pending records
        console.log(`Skipping full update for assignment ${data.remote_id} - has pending records`)
        this.run(
          `UPDATE tp_pokok_a SET 
            status_id = ?, 
            sync_at = datetime('now')
          WHERE remote_id = ?`,
          [safeValue(data.status_id), safeValue(data.remote_id)]
        )
        this.saveToFile()
        return existing.id
      }
      
      // No pending records - safe to update
      this.run(
        `UPDATE tp_pokok_a SET 
          permohonan_id = ?, status_id = ?, kaedah = ?, no_ruj_surat_lulus = ?, 
          status_tanah = ?, daerah = ?, kompartmen = ?, sync_status = 'synced', sync_at = datetime('now')
        WHERE remote_id = ?`,
        [
          safeValue(data.permohonan_id),
          safeValue(data.status_id),
          safeValue(data.kaedah),
          safeValue(data.no_ruj_surat_lulus),
          safeValue(data.status_tanah),
          safeValue(data.daerah),
          safeValue(data.kompartmen),
          safeValue(data.remote_id)
        ]
      )
      this.saveToFile()
      return existing.id
    }
    
    // New assignment - insert
    const result = this.run(
      `INSERT INTO tp_pokok_a 
       (remote_id, permohonan_id, status_id, kaedah, no_ruj_surat_lulus, status_tanah, daerah, kompartmen, sync_status, sync_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', datetime('now'))`,
      [
        safeValue(data.remote_id),
        safeValue(data.permohonan_id),
        safeValue(data.status_id),
        safeValue(data.kaedah),
        safeValue(data.no_ruj_surat_lulus),
        safeValue(data.status_tanah),
        safeValue(data.daerah),
        safeValue(data.kompartmen)
      ]
    )
    this.saveToFile()
    return result.lastInsertRowid
  }

  // Tag recording operations
  saveTagRecord(data: any): number {
    const result = this.run(
      `INSERT INTO tp_tag_pokok_a 
       (tp_pokok_a_id, jenis_tag, no_tag, kod_spesies, ukurlilit_paras_dada, kualiti, catatan, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.tp_pokok_a_id,
        data.jenis_tag,
        data.no_tag,
        data.kod_spesies,
        data.ukurlilit_paras_dada,
        data.kualiti,
        data.catatan,
        data.latitude,
        data.longitude
      ]
    )
    this.saveToFile()
    return result.lastInsertRowid
  }

  // Lokasi recording operations
  saveLokasiRecord(data: any): number {
    const result = this.run(
      `INSERT INTO tp_lokasi_penandaan 
       (tp_pokok_a_id, tarikh, masa_mula, masa_tamat, latitude, longitude, catatan)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.tp_pokok_a_id,
        data.tarikh,
        data.masa_mula,
        data.masa_tamat,
        data.latitude,
        data.longitude,
        data.catatan
      ]
    )
    this.saveToFile()
    return result.lastInsertRowid
  }

  // Aktiviti recording operations
  saveAktivitiRecord(data: any): number {
    const result = this.run(
      `INSERT INTO tp_aktiviti_penandaan 
       (tp_pokok_a_id, tarikh, aktiviti, catatan)
       VALUES (?, ?, ?, ?)`,
      [data.tp_pokok_a_id, data.tarikh, data.aktiviti, data.catatan]
    )
    this.saveToFile()
    return result.lastInsertRowid
  }

  // Get pending records
  getPendingRecords(): { tags: any[]; lokasi: any[]; aktiviti: any[] } {
    return {
      tags: this.query("SELECT * FROM tp_tag_pokok_a WHERE sync_status = 'pending'"),
      lokasi: this.query("SELECT * FROM tp_lokasi_penandaan WHERE sync_status = 'pending'"),
      aktiviti: this.query("SELECT * FROM tp_aktiviti_penandaan WHERE sync_status = 'pending'")
    }
  }

  // Mark records as synced
  markTagSynced(id: number, remoteId: string): void {
    this.run(
      "UPDATE tp_tag_pokok_a SET sync_status = 'synced', remote_id = ?, sync_at = datetime('now') WHERE id = ?",
      [remoteId, id]
    )
    this.saveToFile()
  }

  markLokasiSynced(id: number, remoteId: string): void {
    this.run(
      "UPDATE tp_lokasi_penandaan SET sync_status = 'synced', remote_id = ?, sync_at = datetime('now') WHERE id = ?",
      [remoteId, id]
    )
    this.saveToFile()
  }

  markAktivitiSynced(id: number, remoteId: string): void {
    this.run(
      "UPDATE tp_aktiviti_penandaan SET sync_status = 'synced', remote_id = ?, sync_at = datetime('now') WHERE id = ?",
      [remoteId, id]
    )
    this.saveToFile()
  }

  // Reference data operations
  getReferenceData(table: string): any[] {
    const allowedTables = ['ref_spesies', 'ref_negeri', 'ref_daerah', 'ref_daerah_hutan', 'ref_hutan_simpan']
    if (!allowedTables.includes(table)) {
      throw new Error('Invalid table name')
    }
    return this.query(`SELECT * FROM ${table}`)
  }

  insertReferenceData(table: string, data: any[]): void {
    const allowedTables = ['ref_spesies', 'ref_negeri', 'ref_daerah', 'ref_daerah_hutan', 'ref_hutan_simpan']
    if (!allowedTables.includes(table)) {
      throw new Error('Invalid table name')
    }

    // Clear existing data
    this.run(`DELETE FROM ${table}`)

    // Insert new data
    for (const item of data) {
      const columns = Object.keys(item).join(', ')
      const placeholders = Object.keys(item)
        .map(() => '?')
        .join(', ')
      const values = Object.values(item)

      this.run(
        `INSERT INTO ${table} (${columns}, sync_at) VALUES (${placeholders}, datetime('now'))`,
        values
      )
    }

    this.saveToFile()
  }

  // Sync status
  getSyncStatus(): { pending: number; synced: number; lastSync: string | null } {
    const pendingTags = this.queryOne(
      "SELECT COUNT(*) as count FROM tp_tag_pokok_a WHERE sync_status = 'pending'"
    )
    const pendingLokasi = this.queryOne(
      "SELECT COUNT(*) as count FROM tp_lokasi_penandaan WHERE sync_status = 'pending'"
    )
    const pendingAktiviti = this.queryOne(
      "SELECT COUNT(*) as count FROM tp_aktiviti_penandaan WHERE sync_status = 'pending'"
    )

    const syncedTags = this.queryOne(
      "SELECT COUNT(*) as count FROM tp_tag_pokok_a WHERE sync_status = 'synced'"
    )
    const syncedLokasi = this.queryOne(
      "SELECT COUNT(*) as count FROM tp_lokasi_penandaan WHERE sync_status = 'synced'"
    )
    const syncedAktiviti = this.queryOne(
      "SELECT COUNT(*) as count FROM tp_aktiviti_penandaan WHERE sync_status = 'synced'"
    )

    const lastSync = this.queryOne(`
      SELECT MAX(sync_at) as last_sync FROM (
        SELECT MAX(sync_at) as sync_at FROM tp_tag_pokok_a WHERE sync_status = 'synced'
        UNION ALL
        SELECT MAX(sync_at) as sync_at FROM tp_lokasi_penandaan WHERE sync_status = 'synced'
        UNION ALL
        SELECT MAX(sync_at) as sync_at FROM tp_aktiviti_penandaan WHERE sync_status = 'synced'
      )
    `)

    return {
      pending:
        (pendingTags?.count || 0) + (pendingLokasi?.count || 0) + (pendingAktiviti?.count || 0),
      synced:
        (syncedTags?.count || 0) + (syncedLokasi?.count || 0) + (syncedAktiviti?.count || 0),
      lastSync: lastSync?.last_sync || null
    }
  }
}
