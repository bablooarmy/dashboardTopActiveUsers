SELECT u.id as userId, u.name as userName, u.created_at as userCreatedAt,
	c.id as companyId, c.name as companyName,c.created_at as companyCreatedAt, t.contact_user as companyIsContact,
	l.id as createdListingId, l.name as createdListingName, l.created_at as createdListingCreatedAt, l.description as createdListingDescription,
	a.id as applicationId, a.created_at as applicationCreatedAt, a.cover_letter as applicationCoverLetter,
	l2.id as applicationListingId, l2.name as applicationListingName, l2.description as applicationListingDescription
	FROM users u
INNER JOIN
teams t on t.user_id=u.id
INNER JOIN
companies c on t.company_id=c.id
INNER JOIN
listings l on l.created_by=u.id
INNER JOIN
applications a on a.user_id=u.id
INNER JOIN
listings l2 on a.listing_id=l2.id
WHERE u.id={id}
