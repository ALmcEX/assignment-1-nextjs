import Link from 'next/link';
import { Text } from '@/src/components/language-provider';
export default function NotFound(){return <main className="centered-shell"><section className="state-panel"><h1>404</h1><p><Text id="notFound"/></p><Link href="/"><Text id="returnHome"/></Link></section></main>;}
