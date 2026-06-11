#!/usr/bin/env python3
"""Find best front-facing avatar variants for teacher matching."""
import json

with open('/tmp/heygen-avatars.json') as f:
    data = json.load(f)
avatars = data.get('data', {}).get('avatars', [])

# Get the best 'front' variant for each character (best for talking head)
best_variants = {}
for a in avatars:
    name = a.get('avatar_name', '')
    aid = a.get('avatar_id', '')
    gender = a.get('gender', '')
    
    # Extract base character name
    parts = name.split(' ')
    base = parts[0] if parts else name
    if '_' in name and ' ' not in name:
        base = name.split('_')[0]
    
    # Prefer 'Front' variants (facing camera) and 'Casual' or 'Business' settings
    score = 0
    name_lower = name.lower()
    if 'front' in name_lower: score += 10
    if 'casual' in name_lower: score += 5
    if 'standing' in name_lower: score += 3
    if 'business' in name_lower: score += 2
    if 'sitting' in name_lower: score += 1
    if 'side' in name_lower: score -= 5
    if 'lying' in name_lower: score -= 10
    
    if base not in best_variants or score > best_variants[base]['score']:
        best_variants[base] = {'id': aid, 'name': name, 'gender': gender, 'score': score}

# Print all available characters sorted by gender
targets = [
    'Adriana', 'Mireia', 'Hada', 'Lina', 'Carlotta', 'Violante',
    'Fernando', 'Armando', 'Crisanto', 'Raul', 'Justo', 'Javi', 'Gerardo',
    'Miyu', 'Aiko', 'Jin',
    'Jinwoo', 'Minho',
    'Nadim', 'Chakir', 'Salma', 'Nour', 'Bahar',
    'Giulia', 'Martina', 'Emilia', 'Anja', 'Verena', 'Sabine',
    'Darnell', 'Diran', 'Tito', 'Candace', 'Fina',
    'Aditya', 'Seema', 'Kavya',
    'Onat', 'Derya', 'Tuba',
    'Oxana', 'Masha', 'Blanka', 'Zosia',
    'Marcus', 'Brandon', 'Byron', 'Shawn',
    'Annie', 'Scarlett', 'Abigail', 'Amanda',
    'Bojan', 'Leos', 'Artur', 'Rasmus', 'Leszek',
    'Lucien', 'Bastien', 'Noah', 'Joel',
    'Ren', 'Max', 'Miles', 'Silas',
    'Florin', 'Matteo', 'Patrizio',
    'Francis', 'Fred', 'Chad', 'Bradley',
]

header = f"{'Name':<15} | {'Gender':<6} | {'Avatar ID':<50} | Full Name"
print("Best variants for target characters:")
print(header)
print('-' * 130)
for t in targets:
    if t in best_variants:
        v = best_variants[t]
        print(f"{t:<15} | {v['gender']:<6} | {v['id']:<50} | {v['name']}")

# Save the mapping as JSON for easy use
mapping = {}
for t in targets:
    if t in best_variants:
        mapping[t] = best_variants[t]

with open('/tmp/avatar-matches.json', 'w') as f:
    json.dump(mapping, f, indent=2)
print(f"\nSaved {len(mapping)} avatar matches to /tmp/avatar-matches.json")
