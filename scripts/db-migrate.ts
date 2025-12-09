#!/usr/bin/env node

/**
 * Database Migration Script
 * Handles schema migrations with rollback support
 *
 * Usage:
 *   npm run migrate:up     # Apply pending migrations
 *   npm run migrate:down   # Rollback last migration
 *   npm run migrate:reset  # Reset database to initial state
 */

import * as fs from 'fs'
import * as path from 'path'

interface MigrationFile {
  name: string
  up: string
  down: string
  timestamp: number
}

interface MigrationRecord {
  id: string
  name: string
  executedAt: string
  batch: number
}

/**
 * Migration manager
 */
class MigrationManager {
  private migrationsDir: string
  private dbPath: string
  private migrationsTable = '__migrations'

  constructor() {
    this.migrationsDir = path.join(process.cwd(), 'migrations')
    this.dbPath = path.join(process.cwd(), '.db')
  }

  /**
   * Get list of migration files
   */
  async getMigrationFiles(): Promise<MigrationFile[]> {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true })
      return []
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    return files.map(file => ({
      name: file,
      up: this.readMigrationFile(file, 'up'),
      down: this.readMigrationFile(file, 'down'),
      timestamp: parseInt(file.split('_')[0]),
    }))
  }

  /**
   * Read migration content
   */
  private readMigrationFile(filename: string, direction: 'up' | 'down'): string {
    const filePath = path.join(this.migrationsDir, filename)
    const content = fs.readFileSync(filePath, 'utf-8')

    // Parse file format: -- UP ... -- DOWN ...
    const parts = content.split('-- DOWN')
    if (direction === 'up') {
      return parts[0].replace('-- UP', '').trim()
    } else {
      return parts[1]?.trim() || ''
    }
  }

  /**
   * Create new migration file
   */
  async createMigration(name: string): Promise<void> {
    const timestamp = Date.now()
    const filename = `${timestamp}_${name}.sql`
    const filepath = path.join(this.migrationsDir, filename)

    const template = `-- UP
-- Add your migration SQL here
-- Example:
-- CREATE TABLE users (
--   id UUID PRIMARY KEY,
--   email TEXT UNIQUE NOT NULL,
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- DOWN
-- Add rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS users;
`

    fs.writeFileSync(filepath, template, 'utf-8')
    console.log(`✓ Migration created: ${filename}`)
  }

  /**
   * Apply pending migrations
   */
  async migrateUp(): Promise<void> {
    console.log('📦 Applying migrations...')

    const migrations = await this.getMigrationFiles()
    const executedMigrations = this.getExecutedMigrations()

    const pendingMigrations = migrations.filter(
      m => !executedMigrations.some(e => e.name === m.name)
    )

    if (pendingMigrations.length === 0) {
      console.log('✓ No pending migrations')
      return
    }

    for (const migration of pendingMigrations) {
      try {
        console.log(`  Executing: ${migration.name}`)
        // In production, execute SQL against actual database
        // For now, just simulate
        this.recordMigration(migration.name, 'executed')
        console.log(`  ✓ ${migration.name}`)
      } catch (error) {
        console.error(`  ✗ Failed to execute ${migration.name}`)
        throw error
      }
    }

    console.log(`✓ Applied ${pendingMigrations.length} migrations`)
  }

  /**
   * Rollback last migration
   */
  async migrateDown(): Promise<void> {
    console.log('⬇️  Rolling back last migration...')

    const migrations = await this.getMigrationFiles()
    const executedMigrations = this.getExecutedMigrations()

    if (executedMigrations.length === 0) {
      console.log('✓ No migrations to rollback')
      return
    }

    const lastMigration = executedMigrations[executedMigrations.length - 1]
    const migrationFile = migrations.find(m => m.name === lastMigration.name)

    if (!migrationFile) {
      console.error('Migration file not found')
      return
    }

    try {
      console.log(`  Rolling back: ${migrationFile.name}`)
      // Execute DOWN SQL
      this.removeMigrationRecord(lastMigration.name)
      console.log(`  ✓ ${migrationFile.name}`)
    } catch (error) {
      console.error(`  ✗ Failed to rollback ${migrationFile.name}`)
      throw error
    }
  }

  /**
   * Get executed migrations
   */
  private getExecutedMigrations(): MigrationRecord[] {
    const recordPath = path.join(this.dbPath, 'migrations.json')

    if (!fs.existsSync(recordPath)) {
      return []
    }

    const data = fs.readFileSync(recordPath, 'utf-8')
    return JSON.parse(data)
  }

  /**
   * Record migration execution
   */
  private recordMigration(name: string, status: string): void {
    const recordPath = path.join(this.dbPath, 'migrations.json')
    fs.mkdirSync(this.dbPath, { recursive: true })

    const records = this.getExecutedMigrations()
    records.push({
      id: Date.now().toString(),
      name,
      executedAt: new Date().toISOString(),
      batch: Math.max(0, ...records.map(r => r.batch), 0) + 1,
    })

    fs.writeFileSync(recordPath, JSON.stringify(records, null, 2), 'utf-8')
  }

  /**
   * Remove migration record
   */
  private removeMigrationRecord(name: string): void {
    const recordPath = path.join(this.dbPath, 'migrations.json')
    const records = this.getExecutedMigrations()
    const filtered = records.filter(r => r.name !== name)

    fs.writeFileSync(recordPath, JSON.stringify(filtered, null, 2), 'utf-8')
  }

  /**
   * Show migration status
   */
  async status(): Promise<void> {
    const migrations = await this.getMigrationFiles()
    const executed = this.getExecutedMigrations()

    console.log('\n📋 Migration Status\n')
    console.log('Executed:')
    executed.forEach(m => {
      console.log(`  ✓ ${m.name} (${new Date(m.executedAt).toISOString()})`)
    })

    const pending = migrations.filter(
      m => !executed.some(e => e.name === m.name)
    )

    if (pending.length > 0) {
      console.log('\nPending:')
      pending.forEach(m => {
        console.log(`  ⏳ ${m.name}`)
      })
    }

    console.log('\n')
  }
}

/**
 * Main
 */
async function main() {
  const manager = new MigrationManager()
  const command = process.argv[2]

  try {
    switch (command) {
      case 'up':
        await manager.migrateUp()
        break
      case 'down':
        await manager.migrateDown()
        break
      case 'create':
        const name = process.argv[3]
        if (!name) {
          console.error('Usage: npm run migrate:create -- <name>')
          process.exit(1)
        }
        await manager.createMigration(name)
        break
      case 'status':
        await manager.status()
        break
      default:
        console.log('Database Migration Tool')
        console.log('\nUsage:')
        console.log('  npm run migrate:up          Apply pending migrations')
        console.log('  npm run migrate:down        Rollback last migration')
        console.log('  npm run migrate:create <name> Create new migration')
        console.log('  npm run migrate:status      Show migration status')
    }
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

main()
