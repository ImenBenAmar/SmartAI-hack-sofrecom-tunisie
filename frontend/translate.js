// Translation API call
const translateEmail = async () => {
  const response = await fetch('http://127.0.0.1:8002/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: "Réunion importante demain",
      message: "Bonjour, je voudrais organiser une réunion demain à 14h."
    })
  });

  const data = await response.json();
  
  console.log('Detected Language:', data.detected_language);
  console.log('Translated Subject:', data.subject_translated);
  console.log('Translated Message:', data.message_translated);
};

translateEmail();