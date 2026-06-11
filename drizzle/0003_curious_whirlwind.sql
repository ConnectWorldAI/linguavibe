CREATE TABLE `affiliate_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`tiktokHandle` varchar(128),
	`instagramHandle` varchar(128),
	`youtubeHandle` varchar(128),
	`followerCount` varchar(64),
	`languagesSpoken` varchar(512),
	`languagesTaught` varchar(512),
	`contentNiche` varchar(255),
	`whyJoin` text,
	`tier` enum('tier1','tier2') NOT NULL DEFAULT 'tier1',
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`referralCode` varchar(64),
	`referralLink` varchar(512),
	`parentAffiliateId` int,
	`approvedAt` timestamp,
	`rejectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliate_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`referralId` int,
	`type` enum('tier1_commission','tier2_commission','bonus','adjustment') NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`description` varchar(255),
	`status` enum('pending','approved','paid','cancelled') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`payoutMethod` varchar(64),
	`payoutReference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`referralCode` varchar(64) NOT NULL,
	`tier` enum('tier1','tier2') NOT NULL DEFAULT 'tier1',
	`signedUp` int NOT NULL DEFAULT 1,
	`convertedToPaid` int NOT NULL DEFAULT 0,
	`subscriptionPlan` varchar(64),
	`conversionDate` timestamp,
	`revenueGenerated` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_referral_attribution` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referralCode` varchar(64) NOT NULL,
	`affiliateId` int NOT NULL,
	`source` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_referral_attribution_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_referral_attribution_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `user_sync_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`data` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_sync_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_sync_data_userId_unique` UNIQUE(`userId`)
);
