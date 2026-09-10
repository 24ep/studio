
import { execFileSync } from 'node:child_process';

function runPrisma(args: string[]) {
    if (process.platform === 'win32') {
        execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npx prisma ${args.join(' ')}`], { stdio: 'inherit' });
        return;
    }

    execFileSync('npx', ['prisma', ...args], { stdio: 'inherit' });
}

console.log('Generating database comments...');
try {
    // The generator creates a timestamped Prisma migration directory when
    // schema comments change. Prisma then applies it like any other migration.
    runPrisma(['generate', '--generator', 'comments', '--schema', 'prisma/schema.prisma']);
    console.log('Applying pending migrations...');
    runPrisma(['migrate', 'deploy', '--schema', 'prisma/schema.prisma']);
    console.log('Database comments applied successfully.');
} catch (error) {
    console.error('Failed to apply database comments:', error);
    process.exit(1);
}
