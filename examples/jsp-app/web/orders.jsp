<%-- NoraIvoire — données de démonstration pour templates/jsp/page.jsp (sans contrôleur). © 2026 Jonathan KABLAN — Propriétaire. --%>
<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" %><%
  java.util.List<java.util.Map<String, Object>> orders = new java.util.ArrayList<>();
  orders.add(java.util.Map.of("id", "CMD-0001", "reference", "Commande CMD-0001", "paid", true));
  orders.add(java.util.Map.of("id", "CMD-0002", "reference", "Commande CMD-0002", "paid", false));
  // Identifiant et référence hostiles : doivent rester échappés dans le rendu.
  orders.add(java.util.Map.of("id", "x\"><script>alert(1)</script>", "reference", "<b>Référence piégée</b>", "paid", false));
  request.setAttribute("orders", orders);
%><jsp:forward page="/page.jsp"/>
