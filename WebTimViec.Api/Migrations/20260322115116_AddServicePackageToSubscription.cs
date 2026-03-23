using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebTimViec.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddServicePackageToSubscription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ServicePackageId",
                table: "Subscriptions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_ServicePackageId",
                table: "Subscriptions",
                column: "ServicePackageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Subscriptions_ServicePackages_ServicePackageId",
                table: "Subscriptions",
                column: "ServicePackageId",
                principalTable: "ServicePackages",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Subscriptions_ServicePackages_ServicePackageId",
                table: "Subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_ServicePackageId",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "ServicePackageId",
                table: "Subscriptions");
        }
    }
}
