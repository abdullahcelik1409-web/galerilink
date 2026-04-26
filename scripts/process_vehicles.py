import pandas as pd
import json
import os

# Turkish alphabet for sorting
TR_ALPHABET = "abcçdefgğhıijklmnoöprsştuüvyz"
TR_LOW_MAP = str.maketrans("ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ", "abcçdefgğhıijklmnoöprsştuüvyz")

def tr_sort_key(s):
    """Sort key for Turkish strings."""
    if not isinstance(s, str):
        return s
    return [TR_ALPHABET.index(c) if c in TR_ALPHABET else ord(c) for c in s.translate(TR_LOW_MAP)]

def process_vehicles():
    input_file = "scripts/202604R2.xlsx"
    output_file = "vehicles.json"
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    print(f"Reading {input_file}...")
    try:
        # We use openpyxl engine as requested/pre-installed
        df = pd.read_excel(input_file, engine='openpyxl')
    except Exception as e:
        print(f"Error reading Excel: {e}")
        return

    print("Processing columns...")
    # Standardize column names
    df.columns = [str(c).strip() for c in df.columns]
    
    brand_col = "Marka Adı"
    model_col = "Tip Adı"
    
    # Year columns 2026 to 2012
    year_cols = [str(y) for y in range(2026, 2011, -1)]
    
    # Verify columns exist
    missing = [c for c in [brand_col, model_col] + year_cols if c not in df.columns]
    if missing:
        print(f"Warning: Missing columns: {missing}")
        # Try to find numeric versions of years if strings match
        for m in missing:
            if m.isdigit():
                if int(m) in df.columns:
                    df.rename(columns={int(m): m}, inplace=True)
                elif float(m) in df.columns:
                    df.rename(columns={float(m): m}, inplace=True)

    # Re-verify
    missing = [c for c in [brand_col, model_col] + year_cols if c not in df.columns]
    if missing:
        print(f"Critical Error: Still missing columns: {missing}")
        return

    result = []
    
    # Group by Brand
    brands = df[brand_col].unique()
    # Sort brands
    sorted_brands = sorted(brands, key=tr_sort_key)
    
    for brand in sorted_brands:
        if pd.isna(brand): continue
        
        brand_df = df[df[brand_col] == brand]
        models_list = []
        
        # Group by Model
        models = brand_df[model_col].unique()
        sorted_models = sorted(models, key=tr_sort_key)
        
        for model in sorted_models:
            if pd.isna(model): continue
            
            model_df = brand_df[brand_df[model_col] == model]
            
            # Combine multiple rows for the same model if they exist (though usually unique per model in taxonomy)
            active_years = set()
            for year in year_cols:
                if (model_df[year] > 0).any():
                    active_years.add(int(year))
            
            if active_years:
                models_list.append({
                    "package_name": str(model).strip(),
                    "active_years": sorted(list(active_years), reverse=True)
                })
        
        if models_list:
            result.append({
                "brand": str(brand).strip(),
                "models": models_list
            })

    print(f"Writing output to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print("Successfully created vehicles.json!")

if __name__ == "__main__":
    process_vehicles()
