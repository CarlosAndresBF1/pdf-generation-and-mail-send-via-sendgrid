SELECT `name` AS fullName, '' AS firstName, '' AS lastName,  email, country, document_type AS documentType,  document AS documentNumber, gender, '1' AS certificateId
FROM tmp_cabfs
GROUP BY email
HAVING SUM(DAY = 17) > 0
   AND SUM(DAY = 18) = 0;
