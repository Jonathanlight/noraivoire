<%-- NoraIvoire — rend <nora:btn> avec des valeurs venues de la requête (tests d'attaque, constat A-02).
     © 2026 Jonathan KABLAN — Propriétaire. --%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="nora" tagdir="/WEB-INF/tags/nora" %>
<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Essai</title></head>
<body>
<main id="essai"><nora:btn tone="${param.tone}" size="${param.size}" href="${param.href}" type="${param.type}"><c:out value="${param.label}"/></nora:btn></main>
</body>
</html>
