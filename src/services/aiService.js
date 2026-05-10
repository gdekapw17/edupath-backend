/**
 * Mock AI Service
 * Fungsi ini bertindak sebagai tiruan peladen Machine Learning.
 * Ia akan mengembalikan data prediksi statis dengan jeda waktu (delay)
 * untuk menyimulasikan proses komputasi AI sungguhan.
 *
 * @param {string} assessmentId - ID asesmen yang dikirim oleh pengguna
 * @returns {Promise<object>} - Hasil prediksi karier dan profil kognitif
 */
export const mockPredictCareer = async (assessmentId) => {
  return new Promise((resolve) => {
    const mockResponse = {
      ai_summary:
        "Berdasarkan analisis nilai akademik dan dedikasi belajar, siswa menunjukkan kecenderungan kuat pada logika matematis, komputasi, dan pemecahan masalah spasial.",
      cognitive_profile: [
        { subject: "Logika & Analitik", value: 88 },
        { subject: "Literasi Sains", value: 85 },
        { subject: "Wawasan Sosial", value: 72 },
        { subject: "Komunikasi Verbal", value: 78 },
        { subject: "Manajemen Diri", value: 90 },
        { subject: "Interpersonal", value: 80 },
      ],
      career_matches: [
        {
          career_id: "CAR-002", // Software Engineer
          confidence_score: 0.92,
          match_rank: 1,
        },
        {
          career_id: "CAR-001", // Data Scientist
          confidence_score: 0.85,
          match_rank: 2,
        },
        {
          career_id: "CAR-006", // Arsitek
          confidence_score: 0.76,
          match_rank: 3,
        },
      ],
    };

    setTimeout(() => {
      resolve(mockResponse);
    }, 3000);
  });
};
