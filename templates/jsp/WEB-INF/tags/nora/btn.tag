<%-- Tag file NoraIvoire : <nora:btn tone="danger" size="lg" href="/x">Texte</nora:btn>
     Liste blanche sur tone/size et échappement XML de href : aucune injection d'attribut. --%>
<%@ tag pageEncoding="UTF-8" body-content="scriptless" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<%@ attribute name="tone" required="false" %>
<%@ attribute name="size" required="false" %>
<%@ attribute name="href" required="false" %>
<%@ attribute name="type" required="false" %>
<c:set var="safeTone" value="${tone eq 'neutral' or tone eq 'danger' or tone eq 'success' or tone eq 'warning' ? tone : 'primary'}"/>
<c:set var="safeSize" value="${size eq 'sm' or size eq 'lg' ? size : 'md'}"/>
<%-- Schémas d'URL autorisés : chemins relatifs, ancres, http(s), mailto, tel. Bloque javascript:, data:… --%>
<c:set var="safeHref" value="${(fn:startsWith(href, '/') and not fn:startsWith(href, '//')) or fn:startsWith(href, '#') or fn:startsWith(href, 'https://') or fn:startsWith(href, 'http://') or fn:startsWith(href, 'mailto:') or fn:startsWith(href, 'tel:') ? href : ''}"/>
<c:choose>
  <c:when test="${not empty safeHref}">
    <a class="btn" data-tone="${safeTone}" data-size="${safeSize}" href="${fn:escapeXml(safeHref)}"><jsp:doBody/></a>
  </c:when>
  <c:otherwise>
    <button class="btn" data-tone="${safeTone}" data-size="${safeSize}" type="${type eq 'submit' ? 'submit' : 'button'}"><jsp:doBody/></button>
  </c:otherwise>
</c:choose>
