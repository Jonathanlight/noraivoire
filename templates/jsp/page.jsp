<%-- NoraIvoire — modèle JSP (Jakarta EE / Spring MVC). © 2026 Jonathan KABLAN — Propriétaire. --%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<%@ taglib prefix="nora" tagdir="/WEB-INF/tags/nora" %>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>NoraIvoire — JSP</title>
  <link rel="stylesheet" href="${pageContext.request.contextPath}/noraivoire/noraivoire.css">
  <script type="module" src="${pageContext.request.contextPath}/noraivoire/noraivoire.auto.js"></script>
</head>
<body>
  <main class="container stack py-8">
    <h1 class="text-xl font-bold">Commandes</h1>
    <section class="grid-auto">
      <c:forEach var="order" items="${orders}">
        <article class="card" data-fx="reveal">
          <div class="stack">
            <span class="badge" data-tone="${order.paid ? 'success' : 'warning'}">
              <c:out value="${order.paid ? 'Payée' : 'En attente'}"/>
            </span>
            <h2 class="text-lg font-bold"><c:out value="${order.reference}"/></h2>
            <nora:btn tone="primary" href="${pageContext.request.contextPath}/orders/${fn:escapeXml(order.id)}">Ouvrir</nora:btn>
          </div>
        </article>
      </c:forEach>
    </section>
  </main>
</body>
</html>
