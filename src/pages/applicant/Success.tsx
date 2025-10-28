// pages/applicant/Success.tsx
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Success() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-whitep-4">
      <div className="p-8  text-center">
        <div className="flex justify-center mb-6">
          <img
            src="/images/success.png"
            alt="Success Icon"
            className="w-55 h-55"
          />
        </div>

        <h1 className="text-2xl font-bold mb-2">
          🎉 Your application was sent!
        </h1>
        <p className="text-gray-600">
          Congratulations! You've taken the first step towards a rewarding
          career at Rakamin.
        </p>
        <p className="text-gray-600 mb-6">
          We look forward to learning more about you during the application
          process.
        </p>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => navigate("/jobs")}
            className="bg-primary hover:bg-primary/90"
          >
            Back to Job Listings
          </Button>
        </div>
      </div>
    </div>
  );
}
