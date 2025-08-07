"use client";

import { COLORS } from "@/constants";
import PricingPlans from '@/components/PricingPlans';
import { UserProvider } from "@/app/contexts/UserContext";
import { Suspense } from "react";
import LoadingAnim from "@/components/LoadingAnim";

export default function PricingPage() {
  return (
        <div className={` ${COLORS.surface} overflow-hidden`}>
    <UserProvider>
      <Suspense fallback={<LoadingAnim />}>


          <PricingPlans />

      </Suspense>
    </UserProvider>
        </div>
  );


}
