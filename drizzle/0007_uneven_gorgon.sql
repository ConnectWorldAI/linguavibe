CREATE TABLE `rate_limit_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`endpoint` varchar(128) NOT NULL,
	`attempts` int NOT NULL DEFAULT 1,
	`windowStart` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rate_limit_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `key_endpoint_idx` UNIQUE(`key`,`endpoint`)
);
