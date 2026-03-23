using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebTimViec.Api.Migrations
{
    public partial class AddMissingFieldsSubscriptionAndUser : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastQuotaResetAt",
                table: "Users",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: DateTime.UtcNow);

            migrationBuilder.AddColumn<string>(
                name: "Tier",
                table: "Subscriptions",
                type: "text",
                nullable: false,
                defaultValue: "FREE");

            migrationBuilder.AddColumn<decimal>(
                name: "Amount",
                table: "Subscriptions",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "TransactionId",
                table: "Subscriptions",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastQuotaResetAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Tier",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "Amount",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "TransactionId",
                table: "Subscriptions");
        }
    }
}
