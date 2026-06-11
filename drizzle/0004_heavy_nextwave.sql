ALTER TABLE `affiliate_applications` ADD `stripeConnectAccountId` varchar(128);--> statement-breakpoint
ALTER TABLE `affiliate_applications` ADD `stripeOnboardingComplete` int DEFAULT 0;