import FitnessHeader from "@/components/fitness/FitnessHeader";

export default function FitnessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fitness-scope flex flex-col -mt-4 -mx-4 -mb-20 min-h-[100dvh]">
      <FitnessHeader />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
