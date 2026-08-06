import ReferralClient from "./ReferralClient";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ClinicalReferralPage({
  params,
}: PageProps) {
  const { token } = await params;

  return <ReferralClient token={token} />;
}