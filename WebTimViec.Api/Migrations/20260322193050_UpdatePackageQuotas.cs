using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebTimViec.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePackageQuotas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "UsedFreeViews",
                table: "Users",
                newName: "ConsumedViews");

            migrationBuilder.RenameColumn(
                name: "UsedFreeApplications",
                table: "Users",
                newName: "ConsumedApplications");

            migrationBuilder.AddColumn<int>(
                name: "MaxApplications",
                table: "ServicePackages",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxViews",
                table: "ServicePackages",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxApplications",
                table: "ServicePackages");

            migrationBuilder.DropColumn(
                name: "MaxViews",
                table: "ServicePackages");

            migrationBuilder.RenameColumn(
                name: "ConsumedViews",
                table: "Users",
                newName: "UsedFreeViews");

            migrationBuilder.RenameColumn(
                name: "ConsumedApplications",
                table: "Users",
                newName: "UsedFreeApplications");
        }
    }
}
