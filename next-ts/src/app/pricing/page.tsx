import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // Adjust path as needed
import PricingPlans from '@/components/PricingPlans';

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/');
  }

  // Get user from your database
  const email = session?.user?.email ?? undefined;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PricingPlans userId={user.id} />
    </div>
  );
}