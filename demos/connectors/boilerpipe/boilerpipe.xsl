<?xml version="1.0" encoding="UTF-8" ?>
<!--
	boilerpipe cleaner
	Created by francois on 2011-12-06.
	Copyright (c) 2011 Nectil S.A. All rights reserved.

	select closest ancestor of 'engineed' class="x-boilerpipe-mark1" content <span >
	remove <span class="x-boilerpipe-mark1">...</span>
	remove empty tags
	remove all attributes except href, title, src, alt
	remove inputs, forms, select, etc.
-->

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output encoding="UTF-8" indent="yes" method="xml" />
	<xsl:strip-space elements="*" />

	<!-- utilities params -->
	<xsl:param name="ascii-lower" select="'abcdefghijklmnopqrstuvwxyz'" />
	<xsl:param name="ascii-upper" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'" />

	<xsl:param name="content-tags" select="',h1,h2,h3,h4,h5,h6,p,ul,li,img,span,strong,em,label,a,'" />
	<xsl:param name="forbidden-tags" select="',input,select,script,form,button,iframe,optgroup,option,textarea,script,style,label,'" />
	<xsl:param name="authorized-empty-tags" select="',img,br,'" />
	<xsl:param name="authorized-attributes" select="',href,src,title,alt,'" />

    <xsl:param name="host" select="''"/>
    <xsl:param name="folder" select="''"/>

	<xsl:param name="empty">
		<xsl:text> &#160;
</xsl:text></xsl:param>

	<xsl:template match="/markup">
		<xsl:apply-templates select="*" />
	</xsl:template>

	<xsl:template match="node()">
		<xsl:variable name="value" select="translate(.,$empty,'')" />
		<xsl:variable name="empty-tag" select="descendant-or-self::*[contains($authorized-empty-tags,concat(',',translate(local-name(.),$ascii-upper,$ascii-lower),','))]" />
		<xsl:variable name="tag" select="translate(local-name(),$ascii-upper,$ascii-lower)" />
		<xsl:choose>
			<xsl:when test="not(contains($forbidden-tags,concat(',',$tag,',')))">
				<xsl:if test="not($value = '') or $empty-tag">
					<xsl:variable name="class">
						<xsl:if test="child::span[@class='x-boilerpipe-mark1']">
							<xsl:text>bp </xsl:text>
						</xsl:if>
						<xsl:if test="$tag = 'ul'">
							<xsl:if test="	not(./preceding-sibling::node()[contains($content-tags,concat(',',translate(local-name(.),$ascii-upper,$ascii-lower),','))])
											and not(./following-sibling::node()[contains($content-tags,concat(',',translate(local-name(.),$ascii-upper,$ascii-lower),','))])">
								<xsl:text>nav </xsl:text>
							</xsl:if>
						</xsl:if>
					</xsl:variable>
					<xsl:element name="{$tag}">
			 			<xsl:apply-templates select="./@*[contains($authorized-attributes,concat(',',local-name(.),','))]" mode="clone" />
						<xsl:if test="$class != ''">
							<xsl:attribute name="class"><xsl:value-of select="$class"/></xsl:attribute>
						</xsl:if>
						<xsl:apply-templates />
			 	</xsl:element>
				</xsl:if>
			</xsl:when>
			<xsl:otherwise>
				<!-- nothing! -->
				<!-- <xsl:apply-templates /> -->
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="span[@class='x-boilerpipe-mark1']">
		<xsl:apply-templates />
	</xsl:template>

	<xsl:template match="text()">
		<xsl:value-of select="." />
	</xsl:template>

	<xsl:template match="*" mode="clone">
		<xsl:element name="{local-name(.)}">
			<!-- <xsl:copy-of select="@*"/> -->
			<xsl:apply-templates select="@*" mode="clone"/>
			<xsl:apply-templates mode="clone"/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="@*" mode="clone">
		<xsl:copy-of select="."/>
	</xsl:template>

	<xsl:template match="@src" mode="clone">
		<xsl:attribute name="src">
			<xsl:choose>
				<xsl:when test="substring(.,1,4) = 'http'">
					<!-- absolute -->
					<xsl:value-of select="."/>
				</xsl:when>
				<xsl:when test="substring(.,1,1) = '/'">
					<!-- server relative -->
					<xsl:value-of select="$host"/>
					<xsl:value-of select="."/>
				</xsl:when>
				<xsl:otherwise>
					<!-- file relative -->
					<xsl:value-of select="$folder"/>
					<xsl:value-of select="."/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:attribute>
	</xsl:template>

	<!-- test for highlight but not conclusive
	
	<xsl:apply-templates select="*">
		<xsl:with-param name="engine" select="'highlight'" />
	</xsl:apply-templates>

	<xsl:template match="node()">
		<xsl:param name="engine" />
		<xsl:if test="	not($engine)
						or ($engine = 'highlight' and (descendant::span[@class='x-boilerpipe-mark1'] or contains($authorized-empty-tags,concat(translate(local-name(descendant::node()),$ascii-upper,$ascii-lower),','))))
						or ($engine = 'shadow' and not(child::span[@class='x-boilerpipe-mark1']))">
			<xsl:variable name="value" select="translate(.,$empty,'')" />
			<xsl:variable name="empty-tag" select="descendant-or-self::*[contains($authorized-empty-tags,concat(translate(local-name(.),$ascii-upper,$ascii-lower),','))]" />
			<xsl:variable name="tag" select="translate(local-name(),$ascii-upper,$ascii-lower)" />
			<xsl:choose>
				<xsl:when test="not(contains($forbidden-tags,concat($tag,',')))">
					<xsl:if test="not($value = '') or $empty-tag">
						<xsl:element name="{$tag}">
				 			<xsl:copy-of select="./@*[contains($authorized-attributes,concat(local-name(.),','))]" />
							<xsl:apply-templates>
								<xsl:with-param name="engine" select="$engine" />
							</xsl:apply-templates>
				 	</xsl:element>
					</xsl:if>
				</xsl:when>
				<xsl:otherwise>
					<xsl:apply-templates>
						<xsl:with-param name="engine" select="$engine" />
					</xsl:apply-templates>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:if>
	</xsl:template>
	
	-->
	
</xsl:stylesheet>
