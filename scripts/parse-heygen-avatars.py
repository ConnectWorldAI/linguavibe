#!/usr/bin/env python3
"""Parse HeyGen stock avatars and identify diverse candidates for teacher matching."""
import json
import sys

with open('/tmp/heygen-avatars.json') as f:
    data = json.load(f)

avatars = data.get('data', {}).get('avatars', [])
print(f"Total avatars in HeyGen library: {len(avatars)}")

# Extract unique base characters (remove pose/scene variants)
characters = {}
for a in avatars:
    name = a.get('avatar_name', '')
    aid = a.get('avatar_id', '')
    gender = a.get('gender', 'unknown')
    preview = a.get('preview_image_url', '') or a.get('preview_video_url', '')
    
    # Get base character name (before pose/scene descriptors)
    # Pattern: "Name Scene Pose" or "Name_pose_scene"
    parts = name.split(' ')
    base_name = parts[0] if parts else name
    
    # Skip if it's a variant we already have
    if base_name not in characters:
        characters[base_name] = {
            'id': aid,
            'full_name': name,
            'gender': gender,
            'preview': preview,
            'variants': []
        }
    characters[base_name]['variants'].append({'id': aid, 'name': name})

print(f"\nUnique characters: {len(characters)}")
print("\n=== FEMALE AVATARS ===")
females = [(k, v) for k, v in characters.items() if v['gender'] == 'female']
for name, info in sorted(females):
    print(f"  {name:20} | {info['id']:45} | variants: {len(info['variants'])}")

print(f"\n=== MALE AVATARS ===")
males = [(k, v) for k, v in characters.items() if v['gender'] == 'male']
for name, info in sorted(males):
    print(f"  {name:20} | {info['id']:45} | variants: {len(info['variants'])}")

# Save structured data for matching
output = {
    'total': len(avatars),
    'unique_characters': len(characters),
    'females': {k: {'id': v['id'], 'variants': len(v['variants'])} for k, v in sorted(females)},
    'males': {k: {'id': v['id'], 'variants': len(v['variants'])} for k, v in sorted(males)}
}
with open('/tmp/heygen-characters.json', 'w') as f:
    json.dump(output, f, indent=2)
print(f"\nSaved structured data to /tmp/heygen-characters.json")
