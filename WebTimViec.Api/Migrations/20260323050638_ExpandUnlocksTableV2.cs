using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebTimViec.Api.Migrations
{
    /// <inheritdoc />
    public partial class ExpandUnlocksTableV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserJobViews_JobPosts_JobPostId",
                table: "UserJobViews");

            migrationBuilder.AlterColumn<Guid>(
                name: "JobPostId",
                table: "UserJobViews",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "ViewedUserId",
                table: "UserJobViews",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserJobViews_ViewedUserId",
                table: "UserJobViews",
                column: "ViewedUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserJobViews_JobPosts_JobPostId",
                table: "UserJobViews",
                column: "JobPostId",
                principalTable: "JobPosts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserJobViews_Users_ViewedUserId",
                table: "UserJobViews",
                column: "ViewedUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserJobViews_JobPosts_JobPostId",
                table: "UserJobViews");

            migrationBuilder.DropForeignKey(
                name: "FK_UserJobViews_Users_ViewedUserId",
                table: "UserJobViews");

            migrationBuilder.DropIndex(
                name: "IX_UserJobViews_ViewedUserId",
                table: "UserJobViews");

            migrationBuilder.DropColumn(
                name: "ViewedUserId",
                table: "UserJobViews");

            migrationBuilder.AlterColumn<Guid>(
                name: "JobPostId",
                table: "UserJobViews",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_UserJobViews_JobPosts_JobPostId",
                table: "UserJobViews",
                column: "JobPostId",
                principalTable: "JobPosts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
