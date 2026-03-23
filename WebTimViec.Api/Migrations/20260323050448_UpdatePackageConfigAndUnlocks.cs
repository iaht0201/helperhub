using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebTimViec.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePackageConfigAndUnlocks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowRoleSwitch",
                table: "ServicePackages",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPriority",
                table: "ServicePackages",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "NeedsApproval",
                table: "ServicePackages",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SupportLevel",
                table: "ServicePackages",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsPriority",
                table: "JobPosts",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowRoleSwitch",
                table: "ServicePackages");

            migrationBuilder.DropColumn(
                name: "IsPriority",
                table: "ServicePackages");

            migrationBuilder.DropColumn(
                name: "NeedsApproval",
                table: "ServicePackages");

            migrationBuilder.DropColumn(
                name: "SupportLevel",
                table: "ServicePackages");

            migrationBuilder.DropColumn(
                name: "IsPriority",
                table: "JobPosts");
        }
    }
}
