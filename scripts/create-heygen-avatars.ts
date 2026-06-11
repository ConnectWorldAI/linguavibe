/**
 * Create HeyGen Photo Avatars for all 34 teachers using the v3 API
 * Endpoint: POST https://api.heygen.com/v3/avatars
 * Docs: https://developers.heygen.com/photo-avatar.md
 */

import { TEACHER_REGISTRY } from '../lib/teacher-registry';

const teachers = TEACHER_REGISTRY;

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const BASE_URL = 'https://api.heygen.com';

interface AvatarResult {
  teacherId: string;
  teacherName: string;
  avatarId?: string;
  avatarGroupId?: string;
  status: 'success' | 'failed';
  error?: string;
}

async function createPhotoAvatar(name: string, photoUrl: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/v3/avatars`, {
    method: 'POST',
    headers: {
      'x-api-key': HEYGEN_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'photo',
      name: `ConnectWorld_${name}`,
      file: {
        type: 'url',
        url: photoUrl,
      },
    }),
  });

  const data = await response.json();
  return data;
}

async function main() {
  if (!HEYGEN_API_KEY) {
    console.error('❌ HEYGEN_API_KEY not set');
    process.exit(1);
  }

  console.log(`🎬 Creating HeyGen Photo Avatars for ${teachers.length} teachers...`);
  console.log('============================================================');
  console.log(`Using v3 API: POST ${BASE_URL}/v3/avatars`);
  console.log('');

  const results: AvatarResult[] = [];
  const avatarMap: Record<string, { avatarId: string; groupId: string }> = {};

  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i];
    console.log(`[${i + 1}/${teachers.length}] Creating avatar for ${teacher.name} (${teacher.id})...`);

    try {
      const result = await createPhotoAvatar(teacher.name, teacher.photoUrl);

      if (result.data?.avatar_item?.id) {
        const avatarId = result.data.avatar_item.id;
        const groupId = result.data.avatar_group?.id || '';
        console.log(`  ✅ Success → Avatar ID: ${avatarId}`);
        results.push({
          teacherId: teacher.id,
          teacherName: teacher.name,
          avatarId,
          avatarGroupId: groupId,
          status: 'success',
        });
        avatarMap[teacher.id] = { avatarId, groupId };
      } else {
        const errorMsg = result.error?.message || result.message || JSON.stringify(result);
        console.log(`  ❌ Failed → ${errorMsg}`);
        results.push({
          teacherId: teacher.id,
          teacherName: teacher.name,
          status: 'failed',
          error: errorMsg,
        });
      }
    } catch (err: any) {
      console.log(`  ❌ Error → ${err.message}`);
      results.push({
        teacherId: teacher.id,
        teacherName: teacher.name,
        status: 'failed',
        error: err.message,
      });
    }

    // Rate limiting - wait 2 seconds between requests
    if (i < teachers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n============================================================');
  console.log('📊 RESULTS SUMMARY');
  console.log('============================================================');
  const successes = results.filter(r => r.status === 'success');
  const failures = results.filter(r => r.status === 'failed');
  console.log(`✅ Successful: ${successes.length}`);
  console.log(`❌ Failed: ${failures.length}`);

  if (successes.length > 0) {
    console.log('\n📋 AVATAR MAP (copy this to update TEACHER_HEYGEN_MAP):');
    console.log('------------------------------------------------------------');
    for (const s of successes) {
      console.log(`  "${s.teacherId}": { avatarId: "${s.avatarId}", groupId: "${s.avatarGroupId}" },`);
    }
  }

  if (failures.length > 0) {
    console.log('\n⚠️  FAILURES:');
    for (const f of failures) {
      console.log(`  ${f.teacherName} (${f.teacherId}): ${f.error}`);
    }
  }

  // Save results to file
  const outputPath = './scripts/heygen-avatar-results.json';
  const fs = await import('fs');
  fs.writeFileSync(outputPath, JSON.stringify({ results, avatarMap }, null, 2));
  console.log(`\n💾 Full results saved to: ${outputPath}`);
}

main().catch(console.error);
