"""
Data Migration Script: Studyfy
Migrasi data antar skema DI DALAM Supabase Cloud.
Dari: skema 'public'
Ke: skema 'auth_service' & 'item_service'
"""
import os
import sys
from sqlalchemy import create_engine, text

# HANYA BUTUH SATU URL KARENA SUMBER DAN TUJUAN ADA DI DATABASE YANG SAMA
SUPABASE_URL = os.getenv(
    "SUPABASE_CLOUD_URL", 
    "postgresql://postgres.lkrluvmfdgihzsmmekxb:Wulandari0804@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
)

# PEMETAAN TABEL KE SKEMA MICROSERVICES
MIGRATION_PLAN = {
    "auth_service": [
        "users"
    ],
    "item_service": [
        "assignments",
        "classes",
        "grades",
        "items",
        "materials",
        "submissions",
        "user_class_association"
    ]
}

def migrate_table(conn, table_name, target_schema):
    print(f"  🔄 Memindahkan tabel '{table_name}' dari 'public' ke '{target_schema}'...")
    
    try:
        # 1. Ambil semua data secara eksplisit dari skema 'public'
        rows = conn.execute(text(f"SELECT * FROM public.{table_name}")).mappings().fetchall()
        
        if not rows:
            print(f"      ⏩ Tabel kosong. Dilewati.")
            return

        # 2. Ambil daftar nama kolom secara dinamis
        columns = list(rows[0].keys())
        col_names = ", ".join(columns)
        placeholders = ", ".join([f":{col}" for col in columns])
        
        if 'id' in columns:
            conflict_clause = "ON CONFLICT (id) DO NOTHING"
        elif 'user_id' in columns and 'class_id' in columns:
            conflict_clause = "ON CONFLICT (user_id, class_id) DO NOTHING"
        else:
            conflict_clause = ""

        insert_query = text(f"""
            INSERT INTO {target_schema}.{table_name} ({col_names})
            VALUES ({placeholders})
            {conflict_clause}
        """)

        # 4. Eksekusi insert massal
        conn.execute(insert_query, [dict(row) for row in rows])
        conn.commit()
        print(f"      ✅ Sukses memigrasi {len(rows)} baris data.")

    except Exception as e:
        print(f"      ❌ Gagal memigrasi '{table_name}': {e}")
        # Mencegah efek domino / InFailedSqlTransaction
        conn.rollback()

def migrate():
    print("=" * 60)
    print("🚀 DATA MIGRATION: Supabase 'public' → Microservices Schemas")
    print("=" * 60)

    # Buat mesin koneksi tunggal
    engine = create_engine(SUPABASE_URL)

    with engine.connect() as conn:
        # Eksekusi berdasarkan peta migrasi
        for schema, tables in MIGRATION_PLAN.items():
            print(f"\n📂 Memproses Skema: {schema.upper()}")
            for table_name in tables:
                migrate_table(conn, table_name, schema)

    print("\n" + "=" * 60)
    print("🎉 MIGRATION COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n❌ Migrasi terhenti total: {e}")
        sys.exit(1)