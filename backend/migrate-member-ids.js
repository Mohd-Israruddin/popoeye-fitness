const db = require('./db');

async function migrateMemberIds() {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [members] = await connection.query(
      'SELECT id, member_id, name FROM members ORDER BY id ASC'
    );

    if (members.length === 0) {
      console.log('No members found. Nothing to migrate.');
      await connection.commit();
      return;
    }

    console.log(`Found ${members.length} member(s) to renumber.`);

    // Phase 1: temporary IDs to avoid UNIQUE conflicts
    for (const member of members) {
      await connection.query('UPDATE members SET member_id = ? WHERE id = ?', [
        `__mig_${member.id}`,
        member.id,
      ]);
    }

    // Phase 2: assign sequential IDs starting at 0001
    for (let i = 0; i < members.length; i++) {
      const newMemberId = String(i + 1).padStart(4, '0');
      const member = members[i];
      await connection.query('UPDATE members SET member_id = ? WHERE id = ?', [
        newMemberId,
        member.id,
      ]);
      console.log(`  ${member.name}: ${member.member_id} -> ${newMemberId}`);
    }

    await connection.commit();
    console.log(`\nDone. Renumbered ${members.length} member(s) to 0001–${String(members.length).padStart(4, '0')}.`);
  } catch (error) {
    await connection.rollback();
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    process.exit(process.exitCode || 0);
  }
}

migrateMemberIds();
