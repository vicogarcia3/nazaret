export default function PdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className="bg-white">
        {children}
      </body>
    </html>
  );
}