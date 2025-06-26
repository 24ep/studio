export const dynamic = "force-dynamic";
import { Suspense } from "react";
import SignInClient from "./SignInClient";
import { getPool } from '@/lib/db';
export default async function SignInPage() {
    // Fetch system settings from the database on the server
    let settings = [];
    try {
        const result = await getPool().query('SELECT key, value, "updatedAt" FROM "SystemSetting"');
        settings = result.rows;
    }
    catch (e) {
        // fallback: empty settings, client will handle fallback
    }
    return (<Suspense fallback={<div>Loading...</div>}>
      <SignInClient initialSettings={settings}/>
    </Suspense>);
}
