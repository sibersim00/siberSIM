


// import { useState, useEffect } from "react";
// import dynamic from "next/dynamic";

// const PdfViewer = dynamic(() => import("./PdfViewer"), { ssr: false });

// export default function PdfLoader({ fileUrl }) {
//   const [pdfBlob, setPdfBlob] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [noPdf, setNoPdf] = useState(false);

//   useEffect(() => {
//     if (!fileUrl) {
//       setNoPdf(true);
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setNoPdf(false);

//     fetch(fileUrl)
//       .then((res) => {
//         if (!res.ok) {
//           // File doesn't exist
//           setNoPdf(true);
//           setLoading(false);
//           return null;
//         }
//         return res.blob();
//       })
//       .then((blob) => {
//         if (blob) setPdfBlob(blob);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Failed to fetch PDF:", err);
//         setNoPdf(true);
//         setLoading(false);
//       });
//   }, [fileUrl]);

//   if (loading) return <p>Loading PDF...</p>;
//   if (noPdf)
//     return (
//       <div className="text-center p-4">
//         <h5>No PDF available for this scenario.</h5>
//       </div>
//     );

//   return (
//     <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
//       <PdfViewer file={pdfBlob} />
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("./PdfViewer"), { ssr: false });
export default function PdfLoader({ fileUrl, setPdfNotFound }) {
  const [pdfBlob, setPdfBlob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fileUrl) {
      setPdfNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setPdfNotFound(false);

    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) {
          setPdfNotFound(true);
          setLoading(false);
          return null;
        }
        return res.blob();
      })
      .then((blob) => {
        if (blob) setPdfBlob(blob);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch PDF:", err);
        setPdfNotFound(true);
        setLoading(false);
      });
  }, [fileUrl]);

  if (loading) return <p>Loading PDF...</p>;
  if (pdfBlob === null) return (
    <div className="text-center p-4">
      <h5>No PDF available for this scenario.</h5>
    </div>
  );

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
      <PdfViewer file={pdfBlob} />
    </div>
  );
}
