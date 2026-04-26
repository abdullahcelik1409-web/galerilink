import pandas as pd
import json
import os
import re

# Turkish alphabet for sorting
TR_ALPHABET = "abcçdefgğhıijklmnoöprsştuüvyz"
TR_LOW_MAP = str.maketrans("ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ", "abcçdefgğhıijklmnoöprsştuüvyz")

def tr_sort_key(s):
    if not isinstance(s, str): return ""
    return [TR_ALPHABET.index(c) if c in TR_ALPHABET else ord(c) for c in s.translate(TR_LOW_MAP)]

# Brands known to be strictly NOT passenger cars in TSB lists
BRAND_BLACKLIST = {
    'BMC', 'DAF', 'SCANIA', 'IVECO', 'MAN', 'KARSAN', 'OTOKAR', 'TEMSA', 
    'ISUZU', 'HINO', 'KAMAZ', 'KENWORTH', 'MACK', 'RENAULT TRUCKS', 
    'NEW HOLLAND', 'MASSEY FERGUSON', 'JOHN DEERE', 'BAŞAK', 'CASE', 
    'ERKUNT', 'DEUTZ', 'KTM', 'DUCATI', 'HONDA MOTOR', 'YAMAHA', 
    'HARLEY DAVIDSON', 'KAWASAKI', 'MOTORSIKLET', 'ZIRAI TRAKTOR',
    'ADRIA', 'CARTHAGO', 'HOBBY', 'KNAUS', 'GAZ', 'GULERYUZ', 'NEOPLAN',
    'OTOYOL\\IVECO\\FIAT', 'PIMAKINA', 'SANY', 'IKCO', 'CENNTRO', 'FARIZON AUTO',
    'MAXUS', 'NEOPLAN', 'PIAGGIO', 'VICTORY', 'VEICOLI', 'SANY', 'IKCO'
}


# Keywords that indicate a commercial or non-car vehicle in 'Tip Adı'
TECH_COMMERCIAL_KEYWORDS = [
    'KAMYON', 'CEKICI', 'TIR', 'VAN', 'MINIBUS', 'OTOBUS', 'PICK-UP', 'PICKUP', 
    'KAMYONET', 'TRAKTOR', 'TRAKTÖR', 'KOMBİ', 'KOMBI', 'CRAFTER', 'TRANSIT', 
    'DUCATO', 'SPRINTER', 'BOXER', 'JUMPER', 'DAILY', 'MASTER', 'MOVANO', 
    'TRAFIC', 'PANELVAN', 'SASI', 'ŞASİ', 'KARAVAN', 'MOTORHOME'
]

TRANSMISSION_MAP = {
    'Otomatik': [
        'DSG', 'EDC', 'S TRONIC', 'CVT', 'EAT6', 'EAT8', 'OTM', 'OTOMATIK', 
        'STEPTRONIC', 'TIPTRONIC', '9G-TRONIC', 'E-TOGGLE', 'GEARTRONIC', 
        'POWERSHIFT', 'DCT', 'PDK', 'AUTO', 'AUTOMATIC', '7G-TRONIC'
    ],
    'Manuel': ['MAN', 'MANUEL', 'M/T', 'HAND', 'M.T']
}

FUEL_MAP = {
    'Dizel': ['TDI', 'DCI', 'CRDI', 'BLUEHDI', 'JTD', 'M.JET', 'MULTIJET', 'D', 'DIESEL', 'CDTI', 'DID', 'TDCI', 'SD4', 'TD4', 'D4', 'D5'],
    'Benzin': ['TSI', 'TFSI', 'TCE', 'VTI', 'PURETECH', 'ECOBOOST', 'MPI', 'GDI', 'VVTI', 'HSD', 'T', 'GASOLINE'],
    'Elektrik': ['EV', '%100 ELEKTRIK', 'KW', 'E-TECH', 'Z.E.', 'BEV', 'ELECTRIC'],
    'Hibrit': ['HYBRID', 'MHEV', 'PHEV', 'I-MMD', 'HEV']
}

BODY_MAP = {
    'Sedan': ['SEDAN'],
    'Hatchback': ['HB', 'HATCHBACK'],
    'Station Wagon': ['SW', 'SPORT TOURER', 'AVANT', 'VARIANT', 'STATION WAGON', 'TOURING'],
    'SUV': ['SUV', 'CROSSOVER', 'CROSS'],
    'Coupe': ['COUPE', 'KUP'],
    'Cabrio': ['CABRIO', 'ROADSTER', 'CONVERTIBLE']
}

def extract_engine_size(text):
    # Match patterns like 1.5, 2.0, 1.4T
    match = re.search(r'(\d\.\d)', text)
    if match:
        return match.group(1)
    
    # Check for direct CC values in some TSB entries (e.g. 1598)
    match_cc = re.search(r'(\d{4})', text)
    if match_cc:
        cc = int(match_cc.group(1))
        if 900 < cc < 6500:
            return str(round(cc / 1000, 1))
    
    return None

def parse_car_details(tip_adi):
    tip_adi_upper = str(tip_adi).upper()
    
    # 1. Transmission
    transmission = None
    for trans_type, keywords in TRANSMISSION_MAP.items():
        if any(f" {kw} " in f" {tip_adi_upper} " or tip_adi_upper.endswith(kw) for kw in keywords):
            transmission = trans_type
            break
            
    # 2. Fuel Type
    fuel_type = None
    for f_type, keywords in FUEL_MAP.items():
        if any(f" {kw} " in f" {tip_adi_upper} " or tip_adi_upper.endswith(kw) for kw in keywords):
            fuel_type = f_type
            break
            
    # 3. Body Type
    body_type = None
    for b_type, keywords in BODY_MAP.items():
        if any(f" {kw} " in f" {tip_adi_upper} " or tip_adi_upper.endswith(kw) for kw in keywords):
            body_type = b_type
            break
            
    # 4. Engine Size
    engine_size = extract_engine_size(tip_adi_upper)
    
    # 5. Model Name (Usually first word or two words)
    words = tip_adi.split()
    model_name = words[0] if words else "Unknown"
    
    # Special cases for models like "A3", "320D", "T10X"
    # We take the first word as the core model
    
    return {
        "model_name": model_name,
        "transmission": transmission,
        "fuel_type": fuel_type,
        "body_type": body_type,
        "engine_size": engine_size
    }

def process_database():
    input_file = "scripts/202604R2.xlsx"
    output_file = "vehicles_database.json"
    
    print(f"Reading {input_file}...")
    # header=1 skips the 'Nisan 2026' title row
    df = pd.read_excel(input_file, header=1, engine='openpyxl')
    
    # Identify columns
    # [0: Marka Kodu, 1: Tip Kodu, 2: Marka Adı, 3: Tip Adı, 4: 2026... 18: 2012]
    brand_col = df.columns[2]
    type_col = df.columns[3]
    year_cols = list(df.columns[4:19]) # 2026 to 2012
    
    print("Initial cleanup and filtering...")
    # 1. Strip whitespace
    df[brand_col] = df[brand_col].astype(str).str.strip()
    df[type_col] = df[type_col].astype(str).str.strip()
    
    # 2. Strict Commercial Blacklist (Brand Level)
    df = df[~df[brand_col].isin(BRAND_BLACKLIST)]
    
    # 3. Strict Commercial Blacklist (Keyword Level)
    commercial_pattern = '|'.join(TECH_COMMERCIAL_KEYWORDS)
    df = df[~df[type_col].str.contains(commercial_pattern, case=False, na=False)]
    
    result = []
    
    # Group by Brand
    sorted_brands = sorted(df[brand_col].unique(), key=tr_sort_key)
    
    for brand in sorted_brands:
        brand_df = df[df[brand_col] == brand]
        models_data = []
        
        # Intermediate step to group by 'Model Name' parsed from string
        temp_models = {}
        
        for _, row in brand_df.iterrows():
            tip_adi = row[type_col]
            
            # Active years check
            active_years = []
            for year in year_cols:
                if row[year] > 0:
                    active_years.append(int(year))
            
            if not active_years:
                continue
            
            # Parse details
            details = parse_car_details(tip_adi)
            model_name = details['model_name']
            
            if model_name not in temp_models:
                temp_models[model_name] = []
                
            config = {
                "raw_type_name": tip_adi,
                "package_name": tip_adi, # Keep original as requested (Rule 3)
                "engine_size": details['engine_size'],
                "fuel_type": details['fuel_type'],
                "transmission": details['transmission'],
                "body_type": details['body_type'],
                "active_years": sorted(active_years, reverse=True)
            }
            temp_models[model_name].append(config)
            
        # Structure models for final JSON
        sorted_model_names = sorted(temp_models.keys(), key=tr_sort_key)
        for m_name in sorted_model_names:
            models_data.append({
                "model_name": m_name,
                "configurations": temp_models[m_name]
            })
            
        if models_data:
            result.append({
                "brand": brand,
                "models": models_data
            })
            
    print(f"Writing to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        
    print(f"Success! Processed {len(result)} brands.")

if __name__ == "__main__":
    process_database()
